import { NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { resume, jd } = await req.json();
    if (!resume || !jd) {
      return NextResponse.json(
        { error: "Missing resume or job description" },
        { status: 400 }
      );
    }

    const prompt = `Your goal is to increase the keyword match score between this resume and the job description.

Rewrite ONLY the phrasing — do not add fake projects or fake job titles.
You may generalize and rewrite bullet points to better reflect skills from the JD,
but everything must remain plausible and professional.

JOB DESCRIPTION:
${jd}

ORIGINAL RESUME:
${resume}

Now produce an improved, ATS-optimized resume with stronger keyword alignment:`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("boost-resume error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
