import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    const prompt = `Create a recruiter-friendly summary (5–7 bullets) from this resume.
Make it concise, strong, and written like a professional recruiter.

Resume:
${resumeText}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const summary =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
