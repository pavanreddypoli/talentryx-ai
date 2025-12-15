"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ NEW: role selection state
  const [role, setRole] = useState<"recruiter" | "job_seeker">("recruiter");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // go through after-login so role logic is consistent
        router.push(`/after-login?role=${role}`);
      }
    };
    checkSession();
  }, [router, supabase, role]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let message = error.message;

      // 🎯 Make common supabase errors more user-friendly
      if (message.includes("Invalid login credentials")) {
        message = "Incorrect email or password. Please try again.";
      }

      setError(message);
      setLoading(false);
      return;
    }

    // ✅ Redirect with explicit role intent
    router.push(`/after-login?role=${role}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6
                 bg-gradient-to-br from-indigo-600 to-indigo-900"
    >
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8 animate-fadeIn">

        {/* Logo + Brand */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold flex justify-center items-center gap-2 text-indigo-700">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Talentryx AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* 🔑 ROLE SELECTION (NEW) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              I am signing in as
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={role === "recruiter"}
                  onChange={() => setRole("recruiter")}
                />
                Recruiter
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={role === "job_seeker"}
                  onChange={() => setRole("job_seeker")}
                />
                Job Seeker
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md"
          >
            {loading ? "Logging in…" : "Login"}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-4">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}
