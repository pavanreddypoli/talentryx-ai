"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function AfterLogin() {
  const router = useRouter();

  useEffect(() => {
    async function sync() {
      // 🔄 Sync user profile in Supabase
      await fetch("/api/sync-user", { method: "POST" });

      // 🚀 Redirect to dashboard when done
      router.push("/dashboard");
    }

    sync();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white">

      {/* Logo / Branding */}
      <div className="flex items-center gap-2 mb-6 animate-fadeIn">
        <Sparkles className="h-6 w-6 text-yellow-300" />
        <h1 className="text-2xl font-bold tracking-tight">
          Talentryx AI
        </h1>
      </div>

      {/* Loader */}
      <div className="flex flex-col items-center animate-fadeIn">
        {/* Spinner Animation */}
        <div className="h-10 w-10 border-4 border-yellow-300 border-t-transparent 
                        rounded-full animate-spin mb-4" />

        <p className="text-lg font-medium text-center">
          Setting up your account...
        </p>

        <p className="text-sm text-indigo-200 mt-2 text-center max-w-xs">
          Just a moment — we’re preparing your personalized workspace
          and securing your profile.
        </p>
      </div>
    </div>
  );
}
