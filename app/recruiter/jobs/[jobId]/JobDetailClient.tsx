"use client";

// Filters are client-side state, not URL params. Suspense boundary adds complexity
// for a low-value (single-job) shareability win.

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import type { Job, Candidate, FilterState } from "@/lib/recruiter/types";
import BulkUploadZone from "@/components/recruiter/BulkUploadZone";
import FiltersSidebar from "@/components/recruiter/FiltersSidebar";
import CandidateTable from "@/components/recruiter/CandidateTable";
import CandidateDrawer from "@/components/recruiter/CandidateDrawer";
import EditableJobHeader from "@/components/recruiter/EditableJobHeader";

type Props = {
  initialJob: Job;
  initialCandidates: Candidate[];
  jobId: string;
};

const DEFAULT_FILTERS: FilterState = { score: "all", status: "all", search: "" };

export default function JobDetailClient({ initialJob, initialCandidates, jobId }: Props) {
  const [job, setJob] = useState<Job>(initialJob);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [showJdChangeBanner, setShowJdChangeBanner] = useState(false);

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
      if (filters.search && !c.candidate_name.toLowerCase().includes(filters.search.toLowerCase()))
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

  // ── Job field PATCH ──────────────────────────────────────────────────
  async function onSaveField(field: string, value: string) {
    const prevJob = job;
    setJob((prev) => ({ ...prev, [field]: value })); // optimistic

    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("PATCH failed");

      // Show JD change banner when description changes and candidates exist
      if (field === "description" && value !== prevJob.description && candidates.length > 0) {
        setShowJdChangeBanner(true);
      }
    } catch (err) {
      setJob(prevJob); // revert
      setTableError("Couldn't save changes — please try again"); // 4s auto-dismiss
      throw err; // re-throw so EditableJobHeader can show inline field error
    }
  }

  // ── Candidate status PATCH (optimistic) ──────────────────────────────
  async function handleStatusChange(id: string, status: string) {
    const prevCandidates = candidates;
    const prevActive = activeCandidate;

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
      setCandidates(prevCandidates);
      setActiveCandidate(prevActive);
      setTableError("Couldn't update status — please try again");
    }
  }

  // ── Recruiter notes PATCH ─────────────────────────────────────────────
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

      {/* Editable job header */}
      <EditableJobHeader job={job} stats={stats} onSaveField={onSaveField} />

      {/* Bulk upload — uses latest job.description so ranking always uses current JD */}
      <BulkUploadZone
        jobDescription={job.description}
        jobId={jobId}
        onRankingComplete={(newCandidates) => setCandidates(newCandidates)}
      />

      {/* JD change banner — files not in Supabase Storage so re-rank is deferred to D6.2 */}
      {showJdChangeBanner && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-brand-amber/20 bg-brand-amber/5 px-4 py-3 text-sm">
          <p className="text-slate-700">
            Job description updated. Future uploads will be ranked against the new JD.
            Existing scores reflect the previous description.
          </p>
          <button
            type="button"
            onClick={() => setShowJdChangeBanner(false)}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
        jobId={jobId}
        onClose={() => setActiveCandidate(null)}
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
      />
    </div>
  );
}
