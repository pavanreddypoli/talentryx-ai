import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { text, score } = await req.json();

    const prompt = `You are an expert technical recruiter.

Summarize this candidate into:
- Executive summary (2–3 sentences)
- 5 bullet highlights
- 5 weaknesses
- Recommendation: Strong / Consider / Weak (based on score: ${score})
- 1 Sentence role-fit summary

Resume text:
${text}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const summary =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Summary failed" }, { status: 500 });
  }
}
