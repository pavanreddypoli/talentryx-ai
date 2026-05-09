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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.push("/after-login");
      }
    };
    checkSession();
  }, [router, supabase]);

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

    router.push("/after-login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-navy bg-hero-mesh">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-card animate-fade-up">

        {/* Logo + Brand */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-display font-bold flex justify-center items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-brand-amber" />
            Talentryx AI
          </h1>
          <p className="text-white/60 text-sm mt-1">Welcome back</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <p className="text-red-300 text-sm text-center">{error}</p>
          )}

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

          <Button
            type="submit"
            variant="brand-primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Logging in…" : "Login"}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-4 text-white/60">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand-amber font-medium hover:text-brand-amber-light"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}
