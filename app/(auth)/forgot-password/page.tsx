"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/shared/BrandLogo";

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const redirectTo =
    process.env.NODE_ENV === "production"
      ? "https://talentryxai.com/reset-password"
      : "http://localhost:3000/reset-password";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Fire-and-forget — never reveal whether the email exists
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-brand-navy bg-hero-mesh">
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-card animate-fade-up">

        <div className="text-center mb-6">
          <div className="flex justify-center">
            <BrandLogo href="/" className="text-white" />
          </div>
          <p className="text-white/60 text-sm mt-1">Forgot your password?</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-white/80 leading-relaxed">
              If an account exists for that email, we&apos;ve sent a reset link.
              Check your inbox.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm text-brand-amber font-medium hover:text-brand-amber-light"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/60 mb-5 leading-relaxed">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                type="submit"
                variant="brand-primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-center text-sm mt-4 text-white/60">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-brand-amber font-medium hover:text-brand-amber-light"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
