import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const jobDescription = body?.jobDescription;
    const resumeText = body?.resumeText;
    const currentScore = body?.currentScore;
    const missingKeywords = body?.missingKeywords || [];
    const candidateName = body?.candidateName;

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: "Missing jobDescription or resumeText" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are an ATS optimization expert. Suggest realistic, keyword-focused changes to reach 80%+ match. Do not invent facts.",
            },
            {
              role: "user",
              content: `JOB DESCRIPTION:\n${jobDescription}

CURRENT SCORE: ${currentScore}

MISSING KEYWORDS:
${missingKeywords.join(", ")}

RESUME (${candidateName || "Candidate"}):
${resumeText}`,
            },
          ],
        }),
      }
    );

    const rawText = await openAiResponse.text();

    if (!openAiResponse.ok) {
      console.error("OpenAI boost error:", rawText);
      return NextResponse.json(
        { error: "AI boost failed", details: rawText },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("Boost JSON parse failed:", rawText);
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    const content =
      parsed?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Boost route crashed:", err);
    return NextResponse.json(
      { error: "Boost failed" },
      { status: 500 }
    );
  }
}
