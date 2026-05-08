import type { SupabaseClient } from "@supabase/supabase-js";

export type JobStats = {
  total: number;
  shortlisted: number;
  rejected: number;
  pending: number;
};

export type JobRow = {
  id: string;
  title: string;
  location: string | null;
  experience_level: string | null;
  status: string;
  created_at: string;
};

// Fetches all jobs (RLS-scoped to the authenticated recruiter) plus per-job
// candidate status counts in 3 queries total — no N+1.
// Callers own display filtering (e.g. exclude archived, filter by status).
export async function getJobsWithStats(supabase: SupabaseClient): Promise<{
  jobs: JobRow[];
  perJobStats: Record<string, JobStats>;
}> {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, location, experience_level, status, created_at")
    .order("created_at", { ascending: false });

  const jobList: JobRow[] = jobs ?? [];
  const perJobStats: Record<string, JobStats> = {};

  if (jobList.length > 0) {
    const jobIds = jobList.map((j) => j.id);

    const { data: sessions } = await supabase
      .from("ranking_sessions")
      .select("id, job_id")
      .in("job_id", jobIds);

    const sessionIds = sessions?.map((s) => s.id) ?? [];

    if (sessionIds.length > 0) {
      const { data: results } = await supabase
        .from("ranking_results")
        .select("session_id, status")
        .in("session_id", sessionIds);

      const sessionToJob = new Map(sessions!.map((s) => [s.id, s.job_id]));

      for (const r of results ?? []) {
        const jobId = sessionToJob.get(r.session_id);
        if (!jobId) continue;
        if (!perJobStats[jobId]) {
          perJobStats[jobId] = { total: 0, shortlisted: 0, rejected: 0, pending: 0 };
        }
        perJobStats[jobId].total++;
        if (r.status === "shortlisted") perJobStats[jobId].shortlisted++;
        else if (r.status === "rejected") perJobStats[jobId].rejected++;
        else perJobStats[jobId].pending++;
      }
    }
  }

  return { jobs: jobList, perJobStats };
}
