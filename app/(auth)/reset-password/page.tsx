"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import PasswordInput from "@/components/shared/PasswordInput";
import BrandLogo from "@/components/shared/BrandLogo";

type PageState = "waiting" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Give Supabase time to detect the recovery token from URL hash/code param,
    // then listen for PASSWORD_RECOVERY. If it doesn't fire in 4s, show invalid state.
    const timeout = setTimeout(() => {
      setPageState((s) => (s === "waiting" ? "invalid" : s));
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        clearTimeout(timeout);
        setPageState("ready");
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setPageState("success");
    setTimeout(() => router.push("/login"), 2000);
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
          <p className="text-white/60 text-sm mt-1">Set a new password</p>
        </div>

        {pageState === "waiting" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-6 w-6 text-brand-amber animate-spin" />
            <p className="text-sm text-white/60">Verifying reset link…</p>
          </div>
        )}

        {pageState === "invalid" && (
          <div className="text-center space-y-3">
            <p className="text-sm text-red-300">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <a
              href="/forgot-password"
              className="inline-block text-sm text-brand-amber font-medium hover:text-brand-amber-light"
            >
              Request new link
            </a>
          </div>
        )}

        {pageState === "ready" && (
          <>
            <p className="text-sm text-white/60 mb-5 leading-relaxed">
              Choose a strong password you&apos;ll remember.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                placeholder="New password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <PasswordInput
                placeholder="Confirm new password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button
                type="submit"
                variant="brand-primary"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </>
        )}

        {pageState === "success" && (
          <div className="text-center space-y-2 py-2">
            <p className="text-sm text-emerald-400 font-medium">
              Password updated successfully!
            </p>
            <p className="text-xs text-white/50">Redirecting to login…</p>
          </div>
        )}
      </div>
    </div>
  );
}
