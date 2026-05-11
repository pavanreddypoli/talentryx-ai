import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { resume } = await req.json();
    if (!resume) {
      return NextResponse.json(
        { error: "Missing resume text" },
        { status: 400 }
      );
    }

    const prompt = `Summarize the candidate's resume for a recruiter screening.
Keep it concise, factual, and in bullet points.

Include:
• Key strengths
• Technical skills
• Experience level
• Industries worked in
• Red flags (if any)

Resume:
${resume}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("summary error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
