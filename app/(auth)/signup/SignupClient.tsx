"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = { incompleteSetup: boolean };

export default function SignupClient({ incompleteSetup }: Props) {
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
      options: {
        data: {
          intended_role: role,
          full_name: email.split("@")[0],
        },
      },
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-navy bg-hero-mesh">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-card animate-fade-up">

        <div className="text-center mb-6">
          <h1 className="text-xl font-display font-bold flex justify-center items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-brand-amber" />
            Talentryx AI
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Create a new account
          </p>
        </div>

        {incompleteSetup && (
          <div className="mb-4 rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-3 text-sm text-brand-amber">
            We need to finish setting up your account. Please confirm your role to continue.
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {error && <p className="text-red-300 text-sm text-center">{error}</p>}

          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />

          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />

          {/* ROLE SELECTION — segmented control */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              I am signing up as
            </label>
            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
              <button
                type="button"
                onClick={() => setRole("recruiter")}
                className={`flex-1 rounded-full px-4 py-1.5 text-sm transition-all ${
                  role === "recruiter"
                    ? "bg-brand-amber text-brand-navy font-semibold"
                    : "bg-white/5 border border-white/20 text-white/70 hover:bg-white/10"
                }`}
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => setRole("job_seeker")}
                className={`flex-1 rounded-full px-4 py-1.5 text-sm transition-all ${
                  role === "job_seeker"
                    ? "bg-brand-amber text-brand-navy font-semibold"
                    : "bg-white/5 border border-white/20 text-white/70 hover:bg-white/10"
                }`}
              >
                Job Seeker
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="brand-primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating…" : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm mt-4 text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-amber font-medium hover:text-brand-amber-light">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
