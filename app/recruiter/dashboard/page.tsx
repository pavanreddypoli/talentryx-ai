import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import RecruiterDashboardClient from "./RecruiterDashboardClient";

export default async function RecruiterDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const email = authData.user.email!;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Parallel fetch: user display name + job list
  const [userResult, jobsResult] = await Promise.all([
    supabase.from("users").select("full_name").eq("email", email).single(),
    supabase
      .from("jobs")
      .select("id, title, location, experience_level, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const fullName = userResult.data?.full_name ?? email.split("@")[0];
  const jobs = jobsResult.data ?? [];

  // Aggregate stats across all jobs: sessions → results (2 queries, no N+1)
  type JobStats = { total: number; shortlisted: number; rejected: number; pending: number };
  const perJobStats: Record<string, JobStats> = {};
  let totalCandidates = 0;
  let shortlisted = 0;
  let pending = 0;

  if (jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);

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
        totalCandidates++;
        if (r.status === "shortlisted") {
          perJobStats[jobId].shortlisted++;
          shortlisted++;
        } else if (r.status === "rejected") {
          perJobStats[jobId].rejected++;
        } else {
          perJobStats[jobId].pending++;
          pending++;
        }
      }
    }
  }

  const activeJobs = jobs.filter((j) => j.status === "open").length;

  return (
    <RecruiterDashboardClient
      fullName={fullName}
      today={today}
      stats={{ activeJobs, totalCandidates, shortlisted, pending }}
      jobs={jobs}
      perJobStats={perJobStats}
    />
  );
}
