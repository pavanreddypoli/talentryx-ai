import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { jd } = await req.json();
    if (!jd) {
      return NextResponse.json(
        { error: "Missing job description" },
        { status: 400 }
      );
    }

    const prompt = `
Rewrite the following job description to be:

• Clear
• Attractive to high-quality candidates
• Inclusive and modern
• ATS-friendly
• Professionally formatted

Improve clarity while preserving meaning.

JOB DESCRIPTION:
${jd}

Rewritten JD:
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message?.content || "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("rewrite-jd error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
