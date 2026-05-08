"use client";

import { useState } from "react";
import { X, Star, XCircle, Share2 } from "lucide-react";
import type { Candidate } from "@/lib/recruiter/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScoreBadge } from "@/components/recruiter/CandidateRow";

type Props = {
  candidate: Candidate | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onNotesChange: (id: string, notes: string) => Promise<void>;
};

export default function CandidateDrawer({
  candidate,
  onClose,
  onStatusChange,
  onNotesChange,
}: Props) {
  // notes state is scoped to each candidate via key={candidate.id} on this component in JobDetailClient
  const [notes, setNotes] = useState(candidate?.recruiter_notes ?? "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  if (!candidate) return null;

  async function handleBlur() {
    setIsSavingNotes(true);
    await onNotesChange(candidate!.id, notes);
    setIsSavingNotes(false);
  }

  const scorePct = Math.round(candidate.score * 100);
  const scoreLabel =
    scorePct >= 80 ? "Strong fit" : scorePct >= 60 ? "Potential fit" : "Low match";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-brand-navy leading-tight">
              {candidate.candidate_name || candidate.file_name}
            </h2>
            <div className="flex items-center gap-2">
              <ScoreBadge score={candidate.score} />
              <span className="text-sm text-slate-500">— {scoreLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 transition-colors ml-3 shrink-0"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Strengths */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Strengths</h3>
            {candidate.summary && candidate.summary.length > 0 ? (
              <ul className="space-y-1.5">
                {candidate.summary.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No strengths data available.</p>
            )}
          </div>

          {/* Gaps — missing_keywords stored as raw keyword tokens; displayed as chips */}
          {/* Issue 9 in known_issues.md: prose gap descriptions deferred to D7 polish */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Gaps</h3>
            {candidate.missing_keywords && candidate.missing_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {candidate.missing_keywords.slice(0, 25).map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    {kw}
                  </span>
                ))}
                {candidate.missing_keywords.length > 25 && (
                  <span className="text-xs text-slate-400 self-center">
                    +{candidate.missing_keywords.length - 25} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No gaps data available.</p>
            )}
          </div>

          {/* Resume file info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Resume</h3>
            <p className="text-sm text-slate-500 font-mono">{candidate.file_name}</p>
          </div>

          {/* Recruiter notes — saves on blur */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Recruiter Notes
              {isSavingNotes && (
                <span className="ml-2 text-xs text-slate-400 font-normal">Saving…</span>
              )}
            </h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder="Add notes about this candidate…"
              className="min-h-24 resize-y border-slate-200 focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
            />
            <p className="mt-1 text-xs text-slate-400">Saves automatically when you click away.</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex items-center gap-2 flex-wrap">
          <Button
            variant="brand-primary"
            size="sm"
            disabled={candidate.status === "shortlisted"}
            onClick={() => onStatusChange(candidate.id, "shortlisted")}
          >
            <Star className="h-4 w-4" />
            Shortlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={candidate.status === "rejected"}
            onClick={() => onStatusChange(candidate.id, "rejected")}
            className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          {/* Share — stub, deferred to D7 */}
          <Button
            variant="outline"
            size="sm"
            disabled
            className="ml-auto opacity-50 cursor-not-allowed"
            title="Share — coming in D7"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </>
  );
}
