import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

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

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "You are an ATS optimization expert. Suggest realistic, keyword-focused changes to reach 80%+ match. Do not invent facts.",
      messages: [
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
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Boost route crashed:", err);
    return NextResponse.json(
      { error: "Boost failed" },
      { status: 500 }
    );
  }
}
