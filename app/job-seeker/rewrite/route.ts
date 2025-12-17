import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You are an expert resume writer. Improve clarity, impact, and ATS alignment. Do not invent facts.",
            },
            {
              role: "user",
              content: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME (${candidateName || "Candidate"}):\n${resumeText}`,
            },
          ],
        }),
      }
    );

    const rawText = await openAiResponse.text();

    if (!openAiResponse.ok) {
      console.error("OpenAI rewrite error:", rawText);
      return NextResponse.json(
        { error: "AI rewrite failed", details: rawText },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("Rewrite JSON parse failed:", rawText);
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    const content =
      parsed?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Rewrite route crashed:", err);
    return NextResponse.json(
      { error: "Rewrite failed" },
      { status: 500 }
    );
  }
}
