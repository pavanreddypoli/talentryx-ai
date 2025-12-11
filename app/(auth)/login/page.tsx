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
        router.push("/dashboard");
      }
    };
    checkSession();
  }, []);

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

    router.push("/dashboard");
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
          <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}
