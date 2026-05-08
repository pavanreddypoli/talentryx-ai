import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import JobSeekerLayoutClient from "@/components/jobseeker/JobSeekerLayoutClient";

export default async function JobSeekerBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("active_role")
    .eq("email", authData.user.email!)
    .single();

  if (userRecord?.active_role === "recruiter") {
    redirect("/recruiter/dashboard");
  }

  return <JobSeekerLayoutClient>{children}</JobSeekerLayoutClient>;
}
