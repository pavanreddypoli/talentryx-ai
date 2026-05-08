import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ jobId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const supabase = await createSupabaseServerClient();

  // Confirm job exists and belongs to this recruiter (RLS SELECT on jobs enforces ownership)
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: sessions } = await supabase
    .from("ranking_sessions")
    .select("id")
    .eq("job_id", jobId);

  const sessionIds = sessions?.map((s) => s.id) ?? [];

  if (sessionIds.length === 0) {
    return NextResponse.json({ candidates: [] });
  }

  const { data: candidates, error: resultsErr } = await supabase
    .from("ranking_results")
    .select(
      "id, session_id, candidate_name, file_name, score, keyword_match_percent, matched_keywords, missing_keywords, summary, status, recruiter_notes, created_at"
    )
    .in("session_id", sessionIds)
    .order("score", { ascending: false });

  if (resultsErr) {
    console.error("GET /api/recruiter/jobs/[jobId]/candidates:", resultsErr);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }

  return NextResponse.json({ candidates: candidates ?? [] });
}
