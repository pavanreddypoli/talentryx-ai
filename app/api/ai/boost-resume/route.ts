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
Your goal is to increase the keyword match score between this resume and the job description.

Rewrite ONLY the phrasing — do not add fake projects or fake job titles.
You *may* generalize and rewrite bullet points to better reflect skills from the JD, 
but everything must remain plausible and professional.

JOB DESCRIPTION:
${jd}

ORIGINAL RESUME:
${resume}

Now produce an improved, ATS-optimized resume with stronger keyword alignment:
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message?.content || "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("boost-resume error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
