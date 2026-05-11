import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

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

    const prompt = jd
      ? `You are an expert resume optimizer.

Rewrite the following resume so that it is highly aligned with the job description.
Improve clarity, impact, ATS compliance, and keyword match.
Keep it professional and factual — do NOT invent experience.

JOB DESCRIPTION:
${jd}

ORIGINAL RESUME:
${resume}

Now produce the rewritten resume below:`
      : `You are an expert resume optimizer.

Rewrite the resume to improve clarity, impact, ATS compliance, and keyword usage.
Do NOT invent experience.

RESUME:
${resume}

Return the rewritten resume below:`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      (response.content[0].type === "text" ? response.content[0].text : "").trim();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("rewrite-resume error:", err);
    return NextResponse.json(
      { error: "Rewrite failed", text: "" },
      { status: 500 }
    );
  }
}
