"use client";

import { useState } from "react";
import { X, Share2, Check, FileText } from "lucide-react";
import type { Candidate } from "@/lib/recruiter/types";
import type { CandidateStatus } from "@/lib/candidateStatuses";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusPill from "@/components/recruiter/StatusPill";

type Props = {
  candidate: Candidate | null;
  jobId: string;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onNotesChange: (id: string, notes: string) => Promise<void>;
};

// Hardcoded category mapping is biased toward software/data roles.
// For non-tech jobs (marketing, design, ops), missing keywords may not map cleanly to a
// category and will fall back to "Other gaps" line. Future improvement: AI-generated
// category-aware gap analysis based on JD context.
function buildProseGaps(missingKeywords: string[]): string[] {
  const cloud = new Set(["aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "kubernetes", "k8s"]);
  const data = new Set(["sql", "postgres", "mysql", "mongodb", "etl", "warehouse", "snowflake", "bigquery", "spark"]);
  const backend = new Set(["node", "nodejs", "java", "spring", "python", "fastapi", "django", "api", "microservices"]);
  const frontend = new Set(["react", "nextjs", "next", "angular", "vue", "typescript", "javascript", "ui", "frontend"]);
  const devops = new Set(["docker", "ci", "cd", "cicd", "jenkins", "github", "gitlab", "terraform", "ansible"]);
  const security = new Set(["security", "oauth", "sso", "jwt", "hipaa", "pci", "gdpr", "soc2"]);
  const leadership = new Set(["lead", "leadership", "mentor", "stakeholder", "roadmap", "strategy", "ownership", "communication"]);

  const buckets: Record<string, string[]> = {
    "Cloud/platform keywords": [],
    "Data/SQL keywords": [],
    "Backend/API keywords": [],
    "Frontend/UI keywords": [],
    "DevOps/tooling keywords": [],
    "Security/compliance keywords": [],
    "Leadership indicators": [],
    "Other gaps": [],
  };

  const advice: Record<string, string> = {
    "Cloud/platform keywords": "Add cloud/platform examples where applicable.",
    "Data/SQL keywords": "Add concrete examples of data/SQL usage.",
    "Backend/API keywords": "Highlight backend/API work with specific technologies.",
    "Frontend/UI keywords": "Include UI/frontend technologies if relevant.",
    "DevOps/tooling keywords": "Mention CI/CD and containerization practices.",
    "Security/compliance keywords": "Include security/compliance examples if applicable.",
    "Leadership indicators": "Add leadership/ownership examples (scope, decisions, mentoring).",
    "Other gaps": "Review the job description and address missing terms directly.",
  };

  for (const kw of missingKeywords) {
    const t = kw.toLowerCase();
    if (cloud.has(t)) buckets["Cloud/platform keywords"].push(kw);
    else if (data.has(t)) buckets["Data/SQL keywords"].push(kw);
    else if (backend.has(t)) buckets["Backend/API keywords"].push(kw);
    else if (frontend.has(t)) buckets["Frontend/UI keywords"].push(kw);
    else if (devops.has(t)) buckets["DevOps/tooling keywords"].push(kw);
    else if (security.has(t)) buckets["Security/compliance keywords"].push(kw);
    else if (leadership.has(t)) buckets["Leadership indicators"].push(kw);
    else buckets["Other gaps"].push(kw);
  }

  const result: string[] = [];
  for (const [cat, kws] of Object.entries(buckets)) {
    if (kws.length === 0) continue;
    const top = kws.slice(0, 4).join(", ");
    result.push(`${cat} appear missing: ${top}. ${advice[cat]}`);
    if (result.length >= 3) break;
  }
  return result;
}

function ScoreBadgeLarge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls =
    pct >= 80
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${cls}`}>
      {pct}%
    </span>
  );
}

export default function CandidateDrawer({
  candidate,
  jobId,
  onClose,
  onStatusChange,
  onNotesChange,
}: Props) {
  // notes state is scoped to each candidate via key={candidate.id} on this component in JobDetailClient
  const [notes, setNotes] = useState(candidate?.recruiter_notes ?? "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!candidate) return null;

  async function handleBlur() {
    setIsSavingNotes(true);
    await onNotesChange(candidate!.id, notes);
    setIsSavingNotes(false);
  }

  // Fetched fresh on every click — never cached — so signed URLs are always valid
  // even if the drawer has been open for 2+ hours.
  async function handleViewResume() {
    setIsLoadingResume(true);
    try {
      const res = await fetch(
        `/api/recruiter/jobs/${jobId}/candidates/${candidate!.id}/resume`
      );
      if (!res.ok) throw new Error("No resume available");
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Silent — file not persisted yet (pre-D7 upload or failed upload)
    } finally {
      setIsLoadingResume(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/recruiter/jobs/${jobId}?candidate=${candidate.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const scorePct = Math.round(candidate.score * 100);
  const scoreLabel =
    scorePct >= 80 ? "Strong fit" : scorePct >= 60 ? "Potential fit" : "Low match";

  const proseGaps = buildProseGaps(candidate.missing_keywords ?? []);

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
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-brand-navy leading-tight">
              {candidate.candidate_name || candidate.file_name}
            </h2>
            <div className="flex items-center gap-2">
              <ScoreBadgeLarge score={candidate.score} />
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

          {/* Strengths + Gaps — 2-col grid on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Strengths */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Strengths</h3>
              {candidate.summary && candidate.summary.length > 0 ? (
                <ul className="space-y-2">
                  {candidate.summary.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No strengths data available.</p>
              )}
            </div>

            {/* Gaps — prose sentences from client-side keyword bucketing */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Gaps</h3>
              {proseGaps.length > 0 ? (
                <ul className="space-y-2">
                  {proseGaps.map((g, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No gaps identified.</p>
              )}
            </div>
          </div>

          {/* Resume file info + view button */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Resume</h3>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-slate-500 font-mono truncate">{candidate.file_name}</p>
              {candidate.storage_path ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewResume}
                  disabled={isLoadingResume}
                  className="shrink-0"
                >
                  <FileText className="h-4 w-4" />
                  {isLoadingResume ? "Opening…" : "View"}
                </Button>
              ) : (
                <span className="text-xs text-slate-400 shrink-0">
                  File not stored — re-upload to enable preview
                </span>
              )}
            </div>
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
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">Pipeline stage</span>
            <StatusPill
              status={candidate.status ?? "pending"}
              onChange={(newStatus: CandidateStatus) => onStatusChange(candidate.id, newStatus)}
              size="md"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="ml-auto"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Share"}
          </Button>
        </div>
      </div>
    </>
  );
}
