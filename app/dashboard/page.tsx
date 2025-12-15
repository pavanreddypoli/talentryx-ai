import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import DashboardClient from "./DashboardClient";

// 🔒 NEW: client-side role guard (job seekers must not see recruiter dashboard)
function RoleRedirectGuard() {
  "use client";

  import { useEffect } from "react";
  import { useRouter } from "next/navigation";

  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user_type === "job_seeker") {
          router.replace("/job-seeker/dashboard");
        }
      })
      .catch(() => {
        // fail silently; server guard already exists
      });
  }, [router]);

  return null;
}

export default async function DashboardPage() {
  // MUST await this
  const supabase = await createSupabaseServerClient();

  // Safely get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect the route
  if (!session) {
    redirect("/login");
  }

  // Load the client-side dashboard
  return (
    <>
      <RoleRedirectGuard />
      <DashboardClient />
    </>
  );
}
