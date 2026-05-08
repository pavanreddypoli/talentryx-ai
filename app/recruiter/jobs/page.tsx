import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getJobsWithStats } from "@/lib/recruiter/jobStats";
import JobsListClient from "./JobsListClient";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function RecruiterJobsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { status } = await searchParams;

  const { jobs, perJobStats } = await getJobsWithStats(supabase);

  // Status counts for subtitle — always computed from all jobs, filter-independent
  const statusCounts = { open: 0, closed: 0, archived: 0 };
  for (const j of jobs) {
    if (j.status in statusCounts) {
      statusCounts[j.status as keyof typeof statusCounts]++;
    }
  }

  // Default ("All") shows open + closed. Archived is opt-in.
  const displayJobs =
    !status || status === "all"
      ? jobs.filter((j) => j.status !== "archived")
      : jobs.filter((j) => j.status === status);

  return (
    <JobsListClient
      displayJobs={displayJobs}
      perJobStats={perJobStats}
      statusCounts={statusCounts}
      hasAnyJobs={jobs.length > 0}
      currentStatus={status ?? null}
    />
  );
}
