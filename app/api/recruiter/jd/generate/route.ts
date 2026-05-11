import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, context, requirements, location, experienceLevel } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 });
  }

  const meta = [
    `Job title: ${title.trim()}`,
    location?.trim() ? `Location: ${location.trim()}` : null,
    experienceLevel?.trim() ? `Experience level: ${experienceLevel.trim()}` : null,
    context?.trim() ? `Additional context: ${context.trim()}` : null,
    requirements?.trim() ? `Key requirements: ${requirements.trim()}` : null,
  ].filter(Boolean).join("\n");

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You are an expert HR writer who creates clear, compelling, and inclusive job descriptions.
Write a structured job description with the following sections: a brief company/role introduction, Responsibilities, Required Qualifications, and Nice to Have.
Use inclusive, bias-free language. Be specific and concise. Aim for 300-500 words.
Use plain text only. No markdown headers (##), no bold (**), no asterisks. Format sections with line breaks and indentation only.
Return the job description text only — no preamble, no sign-off.`,
    messages: [{ role: "user", content: `Generate a job description for the following role:\n\n${meta}` }],
  });

  const jdText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  return NextResponse.json({ jdText });
}
