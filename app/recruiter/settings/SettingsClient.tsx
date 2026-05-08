"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  initialFullName: string;
  email: string;
  activeRole: string;
};

export default function SettingsClient({ initialFullName, email, activeRole }: Props) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and account</p>
      </div>

      <ProfileCard initialFullName={initialFullName} email={email} activeRole={activeRole} />
      <PasswordCard />
    </div>
  );
}

// ── Profile card ──────────────────────────────────────────────────────────────

function ProfileCard({
  initialFullName,
  email,
  activeRole,
}: {
  initialFullName: string;
  email: string;
  activeRole: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function startEdit() {
    setPendingName(fullName);
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  }

  function cancelEdit() {
    setIsEditing(false);
    setPendingName("");
    setSaveError(null);
  }

  async function saveName() {
    if (isSaving) return;
    const trimmed = pendingName.trim();
    if (!trimmed) {
      setSaveError("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });
      if (!res.ok) throw new Error("Save failed");
      setFullName(trimmed);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Couldn't save — please try again");
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); saveName(); }
    if (e.key === "Escape") cancelEdit();
  }

  const roleLabel = activeRole === "job_seeker" ? "Job Seeker" : "Recruiter";
  const roleBadge = activeRole === "job_seeker"
    ? "bg-sky-100 text-sky-700 border border-sky-200"
    : "bg-brand-amber/10 text-amber-700 border border-brand-amber/30";

  return (
    <Card variant="light-gradient">
      <CardContent className="py-5 space-y-5">
        <p className="text-sm font-semibold text-slate-700">Profile</p>

        {/* Full name */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full name</p>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="max-w-xs border-brand-amber/60 focus-visible:ring-brand-amber/50"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="brand-primary" size="sm" onClick={saveName} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              </div>
            </div>
          ) : (
            <div className="group flex items-center gap-2 cursor-pointer w-fit" onClick={startEdit}>
              <span className="text-sm text-slate-800 font-medium">
                {fullName || <span className="text-slate-400 italic">Not set</span>}
              </span>
              <Pencil className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-normal">Saved</span>
              )}
            </div>
          )}
        </div>

        {/* Email — read-only */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
          <p className="text-sm text-slate-500">{email}</p>
        </div>

        {/* Active role — read-only badge */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active role</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge}`}>
            {roleLabel}
          </span>
          <p className="text-xs text-slate-400">Use the role switcher in the sidebar to change roles.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Password card ─────────────────────────────────────────────────────────────

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (next.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-authenticate with current password first to validate it
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user.email;
      if (!userEmail) throw new Error("No session");

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: current,
      });
      if (signInErr) {
        setError("Current password is incorrect");
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) throw updateErr;

      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card variant="light-gradient">
      <CardContent className="py-5 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Password</p>

        <form onSubmit={handleSubmit} className="space-y-3 max-w-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Current password
            </label>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              New password
            </label>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-xs text-slate-400">Minimum 8 characters</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Confirm new password
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && (
            <p className="text-xs text-emerald-600 font-medium">Password updated successfully.</p>
          )}

          <Button
            type="submit"
            variant="brand-primary"
            size="sm"
            disabled={isSubmitting || !current || !next || !confirm}
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
