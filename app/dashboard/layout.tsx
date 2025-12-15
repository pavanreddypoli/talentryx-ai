import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

// This imports the FULL client-side dashboard layout (sidebar + mobile menu)
import DashboardClientLayout from "./layoutClient";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  // 🔐 Auth check (existing)
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  // 🧠 NEW: Fetch user role from DB
  const { data: userRecord, error } = await supabase
    .from("users")
    .select("active_role")
    .eq("email", authData.user.email)
    .single();

  if (error) {
    console.error("Failed to load user role:", error);
    redirect("/login");
  }

  // 🚫 BLOCK job seekers from recruiter dashboard
  if (userRecord.active_role === "job_seeker") {
    redirect("/job-seeker/dashboard");
  }

  // ✔ Recruiter → allow dashboard
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
