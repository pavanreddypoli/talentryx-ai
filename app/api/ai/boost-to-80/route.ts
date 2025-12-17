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

Return ONLY a number between 0 and 100.

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

  const raw = result?.choices?.[0]?.message?.content || "0";
  const score = parseFloat(raw);

  return isNaN(score) ? 0 : score;
}

// === REWRITE ===
async function rewriteResume(resume: string, jd?: string): Promise<string> {
  const prompt = jd
    ? `
Rewrite this resume so it matches the job description.
Keep it truthful, concise, ATS friendly, and achievement-driven.

Resume:
${resume}

Job Description:
${jd}

Return only the rewritten resume text.
`
    : `
Rewrite this resume to improve clarity, ATS alignment, and impact.
Keep it truthful.

Resume:
${resume}

Return only the rewritten resume text.
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
  });

  return result?.choices?.[0]?.message?.content || resume;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const resume: string =
      body.resume || body.resumeText || "";

    const jd: string | undefined = body.jd;

    if (!resume) {
      return NextResponse.json(
        { error: "Missing resume text", text: "" },
        { status: 400 }
      );
    }

    // ======================
    // JOB SEEKER MODE
    // ======================
    if (!jd) {
      const improved = await rewriteResume(resume);

      return NextResponse.json({
        beforeScore: null,
        afterScore: null,
        attempts: 1,
        text: improved,
      });
    }

    // ======================
    // RECRUITER MODE
    // ======================
    const originalScore = await getScore(resume, jd);

    let currentResume = resume;
    let currentScore = originalScore;
    let attempts = 0;

    while (currentScore < 80 && attempts < 5) {
      attempts++;
      currentResume = await rewriteResume(currentResume, jd);
      currentScore = await getScore(currentResume, jd);
    }

    return NextResponse.json({
      beforeScore: originalScore,
      afterScore: currentScore,
      attempts,
      text: currentResume,
    });
  } catch (err) {
    console.error("boost-to-80 error:", err);

    // ✅ GUARANTEED JSON
    return NextResponse.json(
      {
        error: "Boost failed",
        beforeScore: null,
        afterScore: null,
        attempts: 0,
        text: "",
      },
      { status: 500 }
    );
  }
}
