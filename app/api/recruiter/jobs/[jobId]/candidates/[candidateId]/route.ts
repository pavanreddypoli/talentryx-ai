import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ jobId: string; candidateId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, candidateId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, recruiter_notes } = body as {
    status?: string;
    recruiter_notes?: string;
  };

  if (status !== undefined && !["pending", "shortlisted", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: pending, shortlisted, rejected" },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch.status = status;
  if (recruiter_notes !== undefined) patch.recruiter_notes = recruiter_notes;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Scope validation: confirm this candidate belongs to the specified job
  const { data: scope, error: scopeErr } = await supabase
    .from("ranking_results")
    .select("session_id, ranking_sessions!inner(job_id)")
    .eq("id", candidateId)
    .single();

  if (scopeErr || !scope) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // ranking_sessions!inner returns an object (single row via !inner join)
  const sessions = scope.ranking_sessions as { job_id: string } | { job_id: string }[];
  const resultJobId = Array.isArray(sessions) ? sessions[0]?.job_id : sessions?.job_id;

  if (resultJobId !== jobId) {
    return NextResponse.json(
      { error: "Candidate does not belong to the specified job" },
      { status: 403 }
    );
  }

  const { data: candidate, error: updateErr } = await supabase
    .from("ranking_results")
    .update(patch)
    .eq("id", candidateId)
    .select()
    .single();

  if (updateErr || !candidate) {
    console.error("PATCH /api/recruiter/jobs/[jobId]/candidates/[candidateId]:", updateErr);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ candidate });
}
