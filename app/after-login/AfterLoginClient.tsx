"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AfterLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function sync() {
      const roleFromQuery = searchParams.get("role") as "recruiter" | "job_seeker" | null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Signup flow only: role param present means a new account is being created.
      // Login flow has no role param — skip sync-user to prevent role accumulation.
      if (roleFromQuery && user?.email) {
        await fetch("/api/sync-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-type": roleFromQuery,
          },
          body: JSON.stringify({
            email: user.email,
            fullName:
              user.user_metadata?.full_name ||
              user.email.split("@")[0],
          }),
        });
      }

      // 🔐 Fetch authoritative role from backend
      const res = await fetch("/api/me");
      const data = await res.json();

      if (res.status === 404) {
        router.push("/signup?reason=incomplete_setup");
        return;
      }

      // 🚀 Redirect based on ACTIVE ROLE
      if (data?.active_role === "job_seeker") {
        router.push("/job-seeker/dashboard");
      } else {
        router.push("/recruiter/dashboard");
      }
    }

    sync();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white">
      <div className="flex items-center gap-2 mb-6 animate-fadeIn">
        <Sparkles className="h-6 w-6 text-yellow-300" />
        <h1 className="text-2xl font-bold">Talentryx AI</h1>
      </div>

      <div className="flex flex-col items-center animate-fadeIn">
        <div className="h-10 w-10 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium">Setting up your account...</p>
      </div>
    </div>
  );
}
