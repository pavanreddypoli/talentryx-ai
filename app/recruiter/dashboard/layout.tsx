import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import RecruiterLayoutClient from "./layoutClient";

export default async function RecruiterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("active_role")
    .eq("email", authData.user.email!)
    .single();

  if (userRecord?.active_role === "job_seeker") {
    redirect("/job-seeker/dashboard");
  }

  return <RecruiterLayoutClient>{children}</RecruiterLayoutClient>;
}
