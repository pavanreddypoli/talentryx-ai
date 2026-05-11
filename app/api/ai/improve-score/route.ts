import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { resumeText, missingKeywords } = await req.json();

    const prompt = `Improve this resume by naturally incorporating the following missing keywords.

Missing Keywords:
${missingKeywords.join(", ")}

Resume:
${resumeText}

Output an improved resume that remains truthful, professional, and keyword-aligned.`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const improved =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ improved });
  } catch (err) {
    console.error("Improve score error:", err);
    return NextResponse.json({ error: "Failed to improve score" }, { status: 500 });
  }
}
