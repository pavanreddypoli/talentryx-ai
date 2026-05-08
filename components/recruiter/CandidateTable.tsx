"use client";

import { Users } from "lucide-react";
import type { Candidate } from "@/lib/recruiter/types";
import CandidateRow from "@/components/recruiter/CandidateRow";

type Props = {
  candidates: Candidate[];
  onView: (c: Candidate) => void;
  tableError: string | null;
};

export default function CandidateTable({ candidates, onView, tableError }: Props) {
  return (
    <div className="space-y-3">
      {/* Status change error banner — auto-dismissed by JobDetailClient after 4 s */}
      {tableError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {tableError}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="py-14 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No candidates match the current filters.</p>
          <p className="text-xs text-slate-400 mt-1">
            Try clearing the filters to see all candidates.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Candidate</span>
            <span>Score</span>
            <span>Status</span>
            <span />
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {candidates.map((c) => (
              <CandidateRow key={c.id} candidate={c} onView={onView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
