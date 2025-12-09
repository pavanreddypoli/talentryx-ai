import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// -------------------------
// DOCX extraction
// -------------------------
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch {
    return buffer.toString("utf-8");
  }
}

// -------------------------
function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildKeywords(jd: string) {
  const stopwords = new Set([
    "and","or","the","a","an","for","to","of","in","with","on","at","by",
    "is","are","as","be","this","that","will","you","we","our","your",
  ]);

  return jd
    .toLowerCase()
    .split(/[^a-z0-9+]+/g)
    .filter((t) => t.length >= 3 && !stopwords.has(t));
}

function computeMatch(jdKeywords: string[], resume: string) {
  const tokens = new Set(
    resume.toLowerCase().split(/[^a-z0-9+]+/g).filter((t) => t.length >= 3)
  );

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    if (tokens.has(kw)) matched.push(kw);
    else missing.push(kw);
  }

  const total = jdKeywords.length || 1;
  const matchPercent = Math.round((matched.length / total) * 100);

  return {
    matched,
    missing,
    matchPercent,
    score: matchPercent / 100,
  };
}

function makeSummary(name: string, pct: number, matched: string[], missing: string[]) {
  return [
    `${name} is a ${
      pct >= 80 ? "strong" : pct >= 60 ? "moderate" : "low"
    } match (${pct}%).`,
    matched.length > 0
      ? `Strengths: ${matched.slice(0, 5).join(", ")}.`
      : `No overlapping strengths found.`,
    missing.length > 0
      ? `Missing/weak: ${missing.slice(0, 5).join(", ")}.`
      : "",
  ].filter(Boolean);
}

// -------------------------
// MAIN HANDLER
// -------------------------
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user;

    // ======================================================
    // 🔐 STEP 1 — CHECK USER SUBSCRIPTION / CREDITS
    // ======================================================
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      console.error("Profile fetch error:", profileErr);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    // ⛔ Block if subscription expired / inactive
    if (profile.stripe_subscription_status === "inactive") {
      return NextResponse.json(
        { error: "Your subscription is inactive. Please upgrade." },
        { status: 402 }
      );
    }

    // ⛔ Free tier limit: 10 analyses
    if (profile.stripe_subscription_status === "free") {
      if (profile.credits_used >= profile.credits_limit) {
        return NextResponse.json(
          {
            error: "Free-tier limit reached",
            message: "Upgrade to Pro for unlimited resume analysis.",
          },
          { status: 402 }
        );
      }
    }

    // ======================================================
    // Continue existing logic
    // ======================================================

    const formData = await req.formData();
    const jobDescription = formData.get("jobDescription") as string;
    const files = formData.getAll("resumes") as File[];

    if (!jobDescription || files.length === 0) {
      return NextResponse.json(
        { error: "Missing job description or files" },
        { status: 400 }
      );
    }

    const jdText = normalizeText(jobDescription);
    const keywords = buildKeywords(jdText);

    // Create ranking session
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("ranking_sessions")
      .insert({
        user_id: user.id,
        job_description: jdText,
      })
      .select()
      .single();

    if (sessionErr || !sessionRow) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const sessionId = sessionRow.id;
    const results: any[] = [];
    const dbRows: any[] = [];

    // Loop each file
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${user.id}/${sessionId}/${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, buffer, {
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) console.error("🚨 UPLOAD ERROR:", uploadError);

      // Extract text
      let text = "";
      
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const pdfModule: any = await import("pdf-parse");
        const pdfParse = pdfModule; // use the module directly
        const parsed = await pdfParse(buffer);
        text = parsed.text || "";
      } else if (file.name.toLowerCase().endsWith(".docx")) {
        text = await extractDocxText(buffer);
      } else {
        text = buffer.toString("utf-8");
      }

      text = normalizeText(text);

      const snippet = text.slice(0, 400);
      const firstLine = text.split("\n")[0]?.trim() || "";
      const name =
        firstLine.length > 0 && firstLine.length < 80
          ? firstLine
          : file.name.replace(/\.(pdf|docx)$/i, "");

      const { matched, missing, matchPercent, score } =
        computeMatch(keywords, text);

      const summary = makeSummary(name, matchPercent, matched, missing);

      const row = {
        candidate_name: name,
        snippet,
        score,
        keyword_match_percent: matchPercent,
        matched_keywords: matched,
        missing_keywords: missing,
        summary,
        full_text: text,
        file_name: file.name,
        storage_path: path,
      };

      results.push(row);
      dbRows.push({ session_id: sessionId, ...row });
    }

    // Insert results
    await supabase.from("ranking_results").insert(dbRows);

    // Sort results
    results.sort((a, b) => b.score - a.score);

    // ======================================================
    // 🎯 STEP 2 — INCREMENT USER CREDITS
    // ======================================================
    await supabase
      .from("profiles")
      .update({
        credits_used: profile.credits_used + 1,
      })
      .eq("id", user.id);

    // ======================================================
    // 🎁 Include remaining credits in response
    // ======================================================
    const remainingCredits =
      profile.credits_limit - (profile.credits_used + 1);

    return NextResponse.json({
      sessionId,
      results,
      creditsUsed: profile.credits_used + 1,
      creditsLimit: profile.credits_limit,
      remainingCredits,
      subscriptionStatus: profile.stripe_subscription_status,
    });

  } catch (err) {
    console.error("ERROR /api/rank:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
