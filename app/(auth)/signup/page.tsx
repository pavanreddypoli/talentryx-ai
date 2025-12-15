"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"recruiter" | "job_seeker">("recruiter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Redirect with role intent
    if (data.session) {
      router.push(`/after-login?role=${role}`);
    } else {
      router.push(`/after-login?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-indigo-900">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold flex justify-center items-center gap-2 text-indigo-700">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Talentryx AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create a new account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

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

          {/* 🔑 ROLE SELECTION */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              I am signing up as
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? "Creating…" : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
