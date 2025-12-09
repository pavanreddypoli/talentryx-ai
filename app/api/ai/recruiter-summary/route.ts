import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    const prompt = `
Create a recruiter-friendly summary (5–7 bullets) from this resume.
Make it concise, strong, and written like a professional recruiter.

Resume:
${resumeText}
`;

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return NextResponse.json({ summary: resp.output_text });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
