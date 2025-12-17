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
async function rewriteResume(resume: string, jd?: string): Promise<string> {
  const rewritePrompt = jd
    ? `
Rewrite this resume so that it better matches the job description.
Keep it truthful, concise, ATS friendly, and achievement-driven.

Resume:
${resume}

Job Description:
${jd}

Return only the rewritten resume text.
`
    : `
Rewrite this resume to improve clarity, impact, and ATS friendliness.
Keep it truthful, concise, and achievement-driven.

Resume:
${resume}

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
    const body = await req.json();

    // ✅ Support job seeker + recruiter flows
    const resume: string =
      body.resume || body.resumeText || "";

    const jd: string | undefined = body.jd;

    if (!resume) {
      return NextResponse.json(
        { error: "Missing resume text" },
        { status: 400 }
      );
    }

    // ==========================
    // JOB SEEKER FLOW (NO JD)
    // ==========================
    if (!jd) {
      const improved = await rewriteResume(resume);

      return NextResponse.json({
        beforeScore: null,
        afterScore: null,
        attempts: 1,
        text: improved,
      });
    }

    // ==========================
    // RECRUITER FLOW (WITH JD)
    // ==========================

    // 1. Score original resume
    const originalScore = await getScore(resume, jd);

    let currentResume = resume;
    let currentScore = originalScore;
    let attempts = 0;

    // 2. Improve until score >= 80 OR 5 attempts
    while (currentScore < 80 && attempts < 5) {
      attempts++;

      const rewritten = await rewriteResume(currentResume, jd);
      const newScore = await getScore(rewritten, jd);

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

    // ✅ Always valid JSON
    return NextResponse.json(
      { error: "AI resume improvement failed" },
      { status: 500 }
    );
  }
}
