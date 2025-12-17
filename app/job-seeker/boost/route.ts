import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type BoostRequest = {
  jobDescription: string;
  resumeText: string;
  currentScore?: number; // 0..1 or percent; we’ll handle both
  missingKeywords?: string[];
  candidateName?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as BoostRequest;
    const jobDescription = (body.jobDescription || "").trim();
    const resumeText = (body.resumeText || "").trim();
    const candidateName = (body.candidateName || "").trim();
    const missingKeywords = Array.isArray(body.missingKeywords)
      ? body.missingKeywords
      : [];

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: "Missing jobDescription or resumeText" },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    // Normalize currentScore to % (best-effort)
    const raw = typeof body.currentScore === "number" ? body.currentScore : 0;
    const currentPct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);

    const system = `You are an ATS optimization coach.
Rules:
- Do NOT invent facts (no fake companies, titles, degrees, certifications).
- Goal: reach 80%+ match by making realistic edits (keywords + phrasing).
- Provide very specific, copy-paste-ready edits and where to apply them.
- Keep output structured and short.`;

    const user = `JOB DESCRIPTION:
${jobDescription}

RESUME TEXT:
${resumeText}

CURRENT MATCH SCORE (approx): ${currentPct}%

MISSING KEYWORDS (if available):
${missingKeywords.length ? missingKeywords.join(", ") : "(not provided)"}

TASK:
Give an action plan to boost ATS match to 80%+.

Return in this format:

# QUICK WINS (5-8)
- (exact change) + (where to apply)
# KEYWORDS TO ADD (10-20)
- keyword: suggested sentence fragment
# REWRITE 3 BULLETS (copy/paste)
1) ...
2) ...
3) ...
`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: candidateName ? `[Candidate: ${candidateName}]\n\n${user}` : user,
          },
        ],
      }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      console.error("OpenAI boost error:", json);
      return NextResponse.json(
        { error: "AI boost failed", details: json?.error?.message || json },
        { status: 500 }
      );
    }

    const content =
      json?.choices?.[0]?.message?.content?.toString?.() || "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("ERROR /api/jobseeker/boost:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
