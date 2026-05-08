import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Ctx = { params: Promise<{ jobId: string; candidateId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, candidateId } = await params;

  const supabase = await createSupabaseServerClient();

  // Validate ownership: candidate must belong to a session under this recruiter's job
  const { data: scope, error: scopeErr } = await supabase
    .from("ranking_results")
    .select("storage_path, ranking_sessions!inner(job_id)")
    .eq("id", candidateId)
    .single();

  if (scopeErr || !scope) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const sessions = scope.ranking_sessions as { job_id: string } | { job_id: string }[];
  const resultJobId = Array.isArray(sessions) ? sessions[0]?.job_id : sessions?.job_id;

  if (resultJobId !== jobId) {
    return NextResponse.json(
      { error: "Candidate does not belong to the specified job" },
      { status: 403 }
    );
  }

  if (!scope.storage_path) {
    return NextResponse.json({ error: "No resume file stored for this candidate" }, { status: 404 });
  }

  // Use service-role client to create the signed URL — the private bucket
  // is not accessible to the authenticated role.
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("resumes")
    .createSignedUrl(scope.storage_path, 3600);

  if (signErr || !signed) {
    console.error("Failed to create signed URL:", signErr);
    return NextResponse.json({ error: "Could not generate resume URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
