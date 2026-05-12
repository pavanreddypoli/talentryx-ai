"use client";

import type { Candidate } from "@/lib/recruiter/types";
import type { CandidateStatus } from "@/lib/candidateStatuses";
import { Button } from "@/components/ui/button";
import StatusPill from "@/components/recruiter/StatusPill";

type Props = {
  candidate: Candidate;
  rank: number;
  onView: (c: Candidate) => void;
  onStatusChange: (id: string, status: string) => void;
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

export default function CandidateRow({ candidate: c, rank, onView, onStatusChange }: Props) {
  const initials = (c.candidate_name || c.file_name || "?").charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-[28px_1fr_80px_148px_68px] gap-2 items-center px-4 py-3 hover:bg-brand-canvas transition-colors">
      {/* Rank badge */}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-white text-xs font-bold shrink-0">
        {rank}
      </span>

      {/* Candidate name + file */}
      <div className="flex items-center gap-2.5 min-w-0">
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

      {/* Score */}
      <div className="flex justify-start">
        <ScoreBadge score={c.score} />
      </div>

      {/* Status pill — clickable dropdown */}
      <div>
        <StatusPill
          status={c.status ?? "pending"}
          onChange={(newStatus: CandidateStatus) => onStatusChange(c.id, newStatus)}
          size="sm"
        />
      </div>

      {/* View button */}
      <Button variant="brand-dark" size="sm" onClick={() => onView(c)}>
        View
      </Button>
    </div>
  );
}
