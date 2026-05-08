import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import RecruiterDashboardClient from "./RecruiterDashboardClient";
import { getJobsWithStats } from "@/lib/recruiter/jobStats";

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

  const [userResult, { jobs, perJobStats }] = await Promise.all([
    supabase.from("users").select("full_name").eq("email", email).single(),
    getJobsWithStats(supabase),
  ]);

  const fullName = userResult.data?.full_name ?? email.split("@")[0];

  const activeJobs = jobs.filter((j) => j.status === "open").length;
  const totalCandidates = Object.values(perJobStats).reduce((s, p) => s + p.total, 0);
  const shortlisted = Object.values(perJobStats).reduce((s, p) => s + p.shortlisted, 0);
  const pending = Object.values(perJobStats).reduce((s, p) => s + p.pending, 0);

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
