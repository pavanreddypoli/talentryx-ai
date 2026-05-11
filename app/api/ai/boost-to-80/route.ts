import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

async function getScore(resume: string, jd: string): Promise<number> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 10,
    system: "You are an ATS scoring engine. Respond with ONLY a single integer between 0 and 100. No other text.",
    messages: [
      {
        role: "user",
        content: `Score the candidate resume against the job description. Return ONLY a number 0-100.

Resume:
${resume}

Job Description:
${jd}`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "0";
  const score = parseFloat(raw.trim());
  return isNaN(score) ? 0 : score;
}

async function rewriteResume(resume: string, jd?: string): Promise<string> {
  const prompt = jd
    ? `Rewrite this resume so it matches the job description.
Keep it truthful, concise, ATS friendly, and achievement-driven.

Resume:
${resume}

Job Description:
${jd}

Return only the rewritten resume text.`
    : `Rewrite this resume to improve clarity, ATS alignment, and impact.
Keep it truthful.

Resume:
${resume}

Return only the rewritten resume text.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : resume;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const resume: string = body.resume || body.resumeText || "";
    const jd: string | undefined = body.jd;

    if (!resume) {
      return NextResponse.json(
        { error: "Missing resume text", text: "" },
        { status: 400 }
      );
    }

    // Job seeker mode — no JD, just improve
    if (!jd) {
      const improved = await rewriteResume(resume);
      return NextResponse.json({
        beforeScore: null,
        afterScore: null,
        attempts: 1,
        text: improved,
      });
    }

    // Recruiter mode — iterate until score >= 80 or 5 attempts
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
