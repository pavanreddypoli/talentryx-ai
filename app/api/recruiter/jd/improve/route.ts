import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { existingJd, title } = await req.json();
  if (!existingJd?.trim()) {
    return NextResponse.json({ error: "Job description is required" }, { status: 400 });
  }

  const context = title?.trim() ? `Job title: ${title.trim()}\n\n` : "";

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You are an expert HR writer who improves job descriptions.
Preserve the core meaning and requirements. Improve clarity, fix grammatical errors, remove biased or exclusionary language, and tighten verbose sections.
Keep the same overall structure and length — do not add new sections or requirements that aren't implied by the original.
Use plain text only. No markdown headers (##), no bold (**), no asterisks. Format sections with line breaks and indentation only.
Return the improved job description text only — no preamble, no explanation of changes, no sign-off.`,
    messages: [{ role: "user", content: `${context}Improve this job description:\n\n${existingJd.trim()}` }],
  });

  const jdText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  return NextResponse.json({ jdText });
}
