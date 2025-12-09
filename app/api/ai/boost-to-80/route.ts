import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// === SCORE PROMPT ===
async function getScore(resume: string, jd: string): Promise<number> {
  const scorePrompt = `
You are an ATS scoring engine used by recruiters.

Score the candidate resume against the job description.

Return ONLY a number between 0 and 100. No words.

Resume:
${resume}

Job Description:
${jd}
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: scorePrompt }],
    max_tokens: 5,
  });

  const score = parseFloat(result.choices[0].message.content || "0");

  return isNaN(score) ? 0 : score;
}

// === REWRITE PROMPT ===
async function rewriteResume(resume: string, jd: string): Promise<string> {
  const rewritePrompt = `
Rewrite this resume so that it better matches the job description.
Keep it truthful, concise, ATS friendly, and achievement-driven.

Resume:
${resume}

Job Description:
${jd}

Return only the rewritten resume text.
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: rewritePrompt }],
    max_tokens: 1500,
  });

  return result.choices[0].message.content || resume;
}

export async function POST(req: Request) {
  try {
    const { resume, jd } = await req.json();

    if (!resume || !jd) {
      return NextResponse.json(
        { error: "Missing resume or job description" },
        { status: 400 }
      );
    }

    // 1. Score original resume
    const originalScore = await getScore(resume, jd);

    let currentResume = resume;
    let currentScore = originalScore;
    let attempts = 0;

    // 2. Improve until score >= 80 OR 5 attempts
    while (currentScore < 80 && attempts < 5) {
      attempts++;

      // rewrite resume
      const rewritten = await rewriteResume(currentResume, jd);

      // re-score rewritten resume
      const newScore = await getScore(rewritten, jd);

      // update working copy
      currentResume = rewritten;
      currentScore = newScore;
    }

    return NextResponse.json({
      beforeScore: originalScore,
      afterScore: currentScore,
      attempts,
      text: currentResume,
    });
  } catch (err) {
    console.error("Boost-to-80 error:", err);
    return NextResponse.json(
      { error: "AI resume improvement failed" },
      { status: 500 }
    );
  }
}
