import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ jobId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: sessions } = await supabase
    .from("ranking_sessions")
    .select("id")
    .eq("job_id", jobId);

  const sessionIds = sessions?.map((s) => s.id) ?? [];

  let totalCandidates = 0;
  let shortlistedCount = 0;
  let rejectedCount = 0;
  let pendingCount = 0;

  if (sessionIds.length > 0) {
    const { data: results } = await supabase
      .from("ranking_results")
      .select("status")
      .in("session_id", sessionIds);

    if (results) {
      totalCandidates = results.length;
      for (const r of results) {
        if (r.status === "shortlisted") shortlistedCount++;
        else if (r.status === "rejected") rejectedCount++;
        else pendingCount++;
      }
    }
  }

  return NextResponse.json({
    job,
    stats: {
      session_count: sessionIds.length,
      total_candidates: totalCandidates,
      shortlisted_count: shortlistedCount,
      rejected_count: rejectedCount,
      pending_count: pendingCount,
    },
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, location, experience_level, status } = body as {
    title?: string;
    description?: string;
    location?: string;
    experience_level?: string;
    status?: string;
  };

  if (status !== undefined && !["open", "closed", "archived"].includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: open, closed, archived" },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.title = title;
  if (description !== undefined) {
    patch.description = description;
    patch.jd_updated_at = new Date().toISOString();
  }
  if (location !== undefined) patch.location = location;
  if (experience_level !== undefined) patch.experience_level = experience_level;
  if (status !== undefined) patch.status = status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .update(patch)
    .eq("id", jobId)
    .select()
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found or update failed" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);

  if (error) {
    console.error("DELETE /api/recruiter/jobs/[jobId]:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  // Intentionally idempotent: RLS silently no-ops when jobId doesn't exist or
  // belongs to another recruiter, so this always returns { success: true }.
  // Double-deletes are safe; callers should not expect 404 on a missing job.
  return NextResponse.json({ success: true });
}
