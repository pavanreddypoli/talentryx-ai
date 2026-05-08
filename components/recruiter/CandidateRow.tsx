"use client";

import type { Candidate } from "@/lib/recruiter/types";
import { Button } from "@/components/ui/button";

type Props = {
  candidate: Candidate;
  onView: (c: Candidate) => void;
};

export function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls =
    pct >= 80
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {pct}%
    </span>
  );
}

export function CandidateStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    shortlisted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] ?? styles.pending
      }`}
    >
      {status}
    </span>
  );
}

export default function CandidateRow({ candidate: c, onView }: Props) {
  const initials = (c.candidate_name || c.file_name || "?").charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3 hover:bg-brand-canvas transition-colors">
      {/* Name + file */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-amber/20 text-brand-navy text-xs font-bold shrink-0">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {c.candidate_name || c.file_name}
          </p>
          <p className="text-xs text-slate-400 truncate">{c.file_name}</p>
        </div>
      </div>

      <ScoreBadge score={c.score} />
      <CandidateStatusPill status={c.status ?? "pending"} />

      <Button variant="brand-dark" size="sm" onClick={() => onView(c)}>
        View
      </Button>
    </div>
  );
}
