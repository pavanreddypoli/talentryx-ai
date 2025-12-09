import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { resumeText, missingKeywords } = await req.json();

    const prompt = `
Improve this resume by naturally incorporating the following missing keywords.

Missing Keywords:
${missingKeywords.join(", ")}

Resume:
${resumeText}

Output an improved resume that remains truthful, professional, and keyword-aligned.
`;

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return NextResponse.json({ improved: resp.output_text });
  } catch (err) {
    console.error("Improve score error:", err);
    return NextResponse.json({ error: "Failed to improve score" }, { status: 500 });
  }
}
