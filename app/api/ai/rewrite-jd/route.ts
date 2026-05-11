import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { jd } = await req.json();
    if (!jd) {
      return NextResponse.json(
        { error: "Missing job description" },
        { status: 400 }
      );
    }

    const prompt = `Rewrite the following job description to be:

• Clear
• Attractive to high-quality candidates
• Inclusive and modern
• ATS-friendly
• Professionally formatted

Improve clarity while preserving meaning.

JOB DESCRIPTION:
${jd}

Rewritten JD:`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("rewrite-jd error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
