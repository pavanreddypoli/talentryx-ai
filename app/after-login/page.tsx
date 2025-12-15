"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function AfterLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function sync() {
      // ✅ NEW: Read explicit role intent from Login / Signup
      const roleFromQuery =
        searchParams.get("role") === "job_seeker"
          ? "job_seeker"
          : "recruiter";

      // ♻️ BACKWARD COMPATIBILITY (keep existing behavior)
      const roleFromStorage =
        typeof window !== "undefined"
          ? localStorage.getItem("talentryx_user_type")
          : null;

      const effectiveRole = roleFromQuery || roleFromStorage || "recruiter";

      // 🔄 Sync user profile in Supabase (with role persistence)
      await fetch("/api/sync-user", {
        method: "POST",
        headers: {
          "x-user-type": effectiveRole,
        },
      });

      // 🔐 Ask server (Supabase) for authoritative role
      const res = await fetch("/api/me", {
        headers: {
          "x-user-email": localStorage.getItem("user_email") || "",
        },
      });

      const data = await res.json();

      // 🚀 Redirect based on ACTIVE ROLE (DB-driven)
      if (data?.user_type === "job_seeker") {
        router.push("/job-seeker/dashboard");
      } else {
        router.push("/dashboard");
      }
    }

    sync();
  }, [router, searchParams]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center
                    bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white"
    >
      {/* Logo / Branding */}
      <div className="flex items-center gap-2 mb-6 animate-fadeIn">
        <Sparkles className="h-6 w-6 text-yellow-300" />
        <h1 className="text-2xl font-bold tracking-tight">Talentryx AI</h1>
      </div>

      {/* Loader */}
      <div className="flex flex-col items-center animate-fadeIn">
        {/* Spinner Animation */}
        <div
          className="h-10 w-10 border-4 border-yellow-300 border-t-transparent 
                        rounded-full animate-spin mb-4"
        />

        <p className="text-lg font-medium text-center">
          Setting up your account...
        </p>

        <p className="text-sm text-indigo-200 mt-2 text-center max-w-xs">
          Just a moment — we’re preparing your personalized workspace and securing
          your profile.
        </p>
      </div>
    </div>
  );
}
