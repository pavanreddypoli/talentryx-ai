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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 🌟 Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 🌟 DO NOT insert into profiles — trigger handles that now.
    //    No need for: supabase.from("profiles").insert({})

    // Optional: If email confirmation is ON, user must check email.
    // Redirect to dashboard only if session exists.
    if (data.session) {
      router.push("/dashboard");
    } else {
      // For email confirmations ON
      router.push("/after-login");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 
                 bg-gradient-to-br from-indigo-600 to-indigo-900"
    >
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">

        {/* Logo + Brand */}
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
