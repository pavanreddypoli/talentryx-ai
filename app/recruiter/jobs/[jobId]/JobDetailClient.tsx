"use client";

// Filters are client-side state, not URL params. Suspense boundary adds complexity
// for a low-value (single-job) shareability win.

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Job, Candidate, FilterState } from "@/lib/recruiter/types";
import { Card, CardContent } from "@/components/ui/card";
import BulkUploadZone from "@/components/recruiter/BulkUploadZone";
import FiltersSidebar from "@/components/recruiter/FiltersSidebar";
import CandidateTable from "@/components/recruiter/CandidateTable";
import CandidateDrawer from "@/components/recruiter/CandidateDrawer";

type Props = {
  initialJob: Job;
  initialCandidates: Candidate[];
  jobId: string;
};

const DEFAULT_FILTERS: FilterState = { score: "all", status: "all", search: "" };

export default function JobDetailClient({ initialJob, initialCandidates, jobId }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showFullJD, setShowFullJD] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // Auto-dismiss tableError after 4 seconds
  useEffect(() => {
    if (!tableError) return;
    const t = setTimeout(() => setTableError(null), 4000);
    return () => clearTimeout(t);
  }, [tableError]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filters.score === "80plus" && c.score < 0.8) return false;
      if (filters.score === "60to79" && (c.score < 0.6 || c.score >= 0.8)) return false;
      if (filters.score === "below60" && c.score >= 0.6) return false;
      if (filters.status !== "all" && c.status !== filters.status) return false;
      if (
        filters.search &&
        !c.candidate_name.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [candidates, filters]);

  const stats = useMemo(
    () => ({
      total: candidates.length,
      shortlisted: candidates.filter((c) => c.status === "shortlisted").length,
      rejected: candidates.filter((c) => c.status === "rejected").length,
    }),
    [candidates]
  );

  async function handleStatusChange(id: string, status: string) {
    const prevCandidates = candidates;
    const prevActive = activeCandidate;

    // Optimistic update — table row + open drawer update immediately
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    if (activeCandidate?.id === id) {
      setActiveCandidate((prev) => (prev ? { ...prev, status } : null));
    }

    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("PATCH failed");
    } catch {
      // Revert both states on failure
      setCandidates(prevCandidates);
      setActiveCandidate(prevActive);
      setTableError("Couldn't update status — please try again");
    }
  }

  async function handleNotesChange(id: string, notes: string) {
    try {
      await fetch(`/api/recruiter/jobs/${jobId}/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiter_notes: notes }),
      });
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, recruiter_notes: notes } : c))
      );
    } catch {
      // Notes save failure is silent — non-critical
    }
  }

  const meta = [initialJob.location, initialJob.experience_level]
    .filter(Boolean)
    .join(" · ");
  const created = new Date(initialJob.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Job header */}
      <Card variant="light-gradient">
        <CardContent className="space-y-3 py-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-brand-navy">
              {initialJob.title}
            </h1>
            <JobStatusPill status={initialJob.status} />
          </div>

          {meta && <p className="text-sm text-slate-500">{meta}</p>}

          <p className="text-xs text-slate-400">
            Created {created}
            {stats.total > 0 && (
              <>
                {" · "}
                {stats.total} candidate{stats.total !== 1 ? "s" : ""}
                {stats.shortlisted > 0 && (
                  <span className="text-emerald-600"> · {stats.shortlisted} shortlisted</span>
                )}
                {stats.rejected > 0 && (
                  <span className="text-red-500"> · {stats.rejected} rejected</span>
                )}
              </>
            )}
          </p>

          <div>
            <p
              className={`text-sm text-slate-600 whitespace-pre-line ${
                showFullJD ? "" : "line-clamp-3"
              }`}
            >
              {initialJob.description}
            </p>
            <button
              type="button"
              onClick={() => setShowFullJD((v) => !v)}
              className="mt-1 text-xs text-brand-amber hover:underline"
            >
              {showFullJD ? "Show less" : "Show more"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk upload zone */}
      <BulkUploadZone
        jobDescription={initialJob.description}
        jobId={jobId}
        onRankingComplete={(newCandidates) => setCandidates(newCandidates)}
      />

      {/* Candidates section */}
      {candidates.length === 0 ? (
        <div className="py-14 flex flex-col items-center text-center gap-2">
          <p className="text-slate-500 text-sm">
            Upload resumes above to start ranking candidates.
          </p>
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          <aside className="w-52 shrink-0">
            <FiltersSidebar filters={filters} onChange={setFilters} />
          </aside>
          <div className="flex-1 min-w-0">
            <CandidateTable
              candidates={filteredCandidates}
              onView={setActiveCandidate}
              tableError={tableError}
            />
          </div>
        </div>
      )}

      {/* Candidate detail drawer — key remounts on candidate change, resetting notes state */}
      <CandidateDrawer
        key={activeCandidate?.id}
        candidate={activeCandidate}
        onClose={() => setActiveCandidate(null)}
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
      />
    </div>
  );
}

function JobStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
    archived: "bg-slate-100 text-slate-400",
  };
  const dots: Record<string, string> = {
    open: "bg-emerald-500",
    closed: "bg-slate-400",
    archived: "bg-slate-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] ?? styles.closed
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dots[status] ?? dots.closed}`}
      />
      {status}
    </span>
  );
}
