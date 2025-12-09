import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { resume } = await req.json();
    if (!resume) {
      return NextResponse.json(
        { error: "Missing resume text" },
        { status: 400 }
      );
    }

    const prompt = `
Summarize the candidate's resume for a recruiter screening.
Keep it concise, factual, and in bullet points.

Include:
• Key strengths  
• Technical skills  
• Experience level  
• Industries worked in  
• Red flags (if any)

Resume:
${resume}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message?.content || "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("summary error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
