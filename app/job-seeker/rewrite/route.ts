import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const jobDescription = body?.jobDescription;
    const resumeText = body?.resumeText;
    const candidateName = body?.candidateName;

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: "Missing jobDescription or resumeText" },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "You are an expert resume writer. Improve clarity, impact, and ATS alignment. Do not invent facts.",
      messages: [
        {
          role: "user",
          content: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME (${candidateName || "Candidate"}):\n${resumeText}`,
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Rewrite route crashed:", err);
    return NextResponse.json(
      { error: "Rewrite failed" },
      { status: 500 }
    );
  }
}
