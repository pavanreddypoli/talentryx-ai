import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RewriteRequest = {
  jobDescription: string;
  resumeText: string;
  candidateName?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as RewriteRequest;
    const jobDescription = (body.jobDescription || "").trim();
    const resumeText = (body.resumeText || "").trim();
    const candidateName = (body.candidateName || "").trim();

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: "Missing jobDescription or resumeText" },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    const system = `You are an expert resume writer and ATS optimization specialist.
Rules:
- Do NOT invent facts (no new employers, titles, dates, degrees, certifications).
- Improve clarity, impact, and ATS alignment.
- Prefer quantified results when already implied, but do not fabricate numbers.
- Output must be concise and actionable.`;

    const user = `JOB DESCRIPTION:
${jobDescription}

RESUME TEXT:
${resumeText}

TASK:
Rewrite the resume to better match the job description.
Return in this format:

# REWRITTEN SUMMARY (3-5 lines)
...
# REWRITTEN EXPERIENCE BULLETS (8-14 bullets)
- ...
# TOP KEYWORD INSERTIONS (5-10 items)
- keyword: where to add it (section)
`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: candidateName ? `[Candidate: ${candidateName}]\n\n${user}` : user,
          },
        ],
      }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      console.error("OpenAI rewrite error:", json);
      return NextResponse.json(
        { error: "AI rewrite failed", details: json?.error?.message || json },
        { status: 500 }
      );
    }

    const content =
      json?.choices?.[0]?.message?.content?.toString?.() || "";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("ERROR /api/jobseeker/rewrite:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
