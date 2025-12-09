import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { text, score } = await req.json();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are an expert technical recruiter.

Summarize this candidate into:
- Executive summary (2–3 sentences)
- 5 bullet highlights
- 5 weaknesses
- Recommendation: Strong / Consider / Weak (based on score: ${score})
- 1 Sentence role-fit summary

Resume text:
${text}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }]
    });

    return NextResponse.json({
      summary: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Summary failed" }, { status: 500 });
  }
}
