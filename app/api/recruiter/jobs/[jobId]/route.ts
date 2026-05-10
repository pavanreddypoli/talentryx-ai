import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

  // Ownership check via RLS — returns null if unowned or not found
  const supabase = await createSupabaseServerClient();
  const { data: job } = await supabase.from("jobs").select("id").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Step 1: collect session IDs (ranking_sessions.job_id FK is SET NULL, not CASCADE)
  const { data: sessions } = await supabaseAdmin
    .from("ranking_sessions")
    .select("id")
    .eq("job_id", jobId);

  const sessionIds = sessions?.map((s) => s.id) ?? [];

  if (sessionIds.length > 0) {
    // Step 2: collect storage paths before deleting rows
    const { data: results } = await supabaseAdmin
      .from("ranking_results")
      .select("storage_path")
      .in("session_id", sessionIds);

    const paths = (results ?? [])
      .map((r) => r.storage_path)
      .filter((p): p is string => !!p);

    // Step 3: delete storage files — non-fatal; log and continue on failure
    if (paths.length > 0) {
      const { error: storageErr } = await supabaseAdmin.storage.from("resumes").remove(paths);
      if (storageErr) console.error("Storage cleanup error (non-fatal):", storageErr);
    }

    // Step 4: delete sessions — ON DELETE CASCADE removes ranking_results automatically
    await supabaseAdmin.from("ranking_sessions").delete().in("id", sessionIds);
  }

  // Step 5: delete the job
  await supabaseAdmin.from("jobs").delete().eq("id", jobId);

  return new NextResponse(null, { status: 204 });
}
