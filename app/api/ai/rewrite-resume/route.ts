import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { resume, jd } = await req.json();
    if (!resume || !jd) {
      return NextResponse.json(
        { error: "Missing resume or job description" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert resume optimizer.

Rewrite the following resume so that it is highly aligned with the job description.
Improve clarity, impact, ATS compliance, and keyword match.
Keep it professional and factual — do NOT invent experience.

JOB DESCRIPTION:
${jd}

ORIGINAL RESUME:
${resume}

Now produce the rewritten resume below:
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message?.content || "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("rewrite-resume error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
