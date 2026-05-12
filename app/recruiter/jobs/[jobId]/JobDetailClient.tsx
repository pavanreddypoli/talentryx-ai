"use client";

// Filters are client-side state, not URL params. Suspense boundary adds complexity
// for a low-value (single-job) shareability win.

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, SlidersHorizontal, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Job, Candidate, FilterState } from "@/lib/recruiter/types";
import BulkUploadZone from "@/components/recruiter/BulkUploadZone";
import FiltersSidebar from "@/components/recruiter/FiltersSidebar";
import CandidateTable from "@/components/recruiter/CandidateTable";
import CandidateDrawer from "@/components/recruiter/CandidateDrawer";
import EditableJobHeader from "@/components/recruiter/EditableJobHeader";
import DeleteJobModal from "@/components/recruiter/DeleteJobModal";

type Props = {
  initialJob: Job;
  initialCandidates: Candidate[];
  jobId: string;
  initialCandidateId: string | null;
  initialNeedsRerank: boolean;
  initialStaleCount: number;
};

const DEFAULT_FILTERS: FilterState = { score: "all", status: "all", search: "" };

export default function JobDetailClient({ initialJob, initialCandidates, jobId, initialCandidateId, initialNeedsRerank, initialStaleCount }: Props) {
  const router = useRouter();
  const [job, setJob] = useState<Job>(initialJob);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [needsRerank, setNeedsRerank] = useState(initialNeedsRerank);
  const [staleCount, setStaleCount] = useState(initialStaleCount);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rerankModalOpen, setRerankModalOpen] = useState(false);
  const [isReranking, setIsReranking] = useState(false);
  const [rerankError, setRerankError] = useState<string | null>(null);
  const [rerankSuccess, setRerankSuccess] = useState<string | null>(null);

  // Auto-dismiss tableError after 4 seconds
  useEffect(() => {
    if (!tableError) return;
    const t = setTimeout(() => setTableError(null), 4000);
    return () => clearTimeout(t);
  }, [tableError]);

  // Auto-open drawer when a ?candidate= deep-link param is present
  useEffect(() => {
    if (!initialCandidateId) return;
    const match = initialCandidates.find((c) => c.id === initialCandidateId);
    if (match) setActiveCandidate(match);
  }, [initialCandidateId, initialCandidates]);

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

      // Mark candidates stale when JD changes and candidates exist
      if (field === "description" && value !== prevJob.description && candidates.length > 0) {
        setNeedsRerank(true);
        setStaleCount(candidates.length);
        setRerankSuccess(null);
      }
    } catch (err) {
      setJob(prevJob); // revert
      setTableError("Couldn't save changes — please try again"); // 4s auto-dismiss
      throw err; // re-throw so EditableJobHeader can show inline field error
    }
  }

  // ── Hard delete job ───────────────────────────────────────────────────
  async function handleDeleteJob() {
    const res = await fetch(`/api/recruiter/jobs/${jobId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Delete failed — please try again");
    }
    router.push("/recruiter/jobs?deleted=1");
  }

  // ── Re-rank stale candidates ──────────────────────────────────────────
  async function handleRerank() {
    setIsReranking(true);
    setRerankError(null);
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}/rerank`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Re-rank failed");

      // Refresh candidates table with updated scores
      const refreshRes = await fetch(`/api/recruiter/jobs/${jobId}/candidates`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) setCandidates(refreshData.candidates ?? []);

      setNeedsRerank(false);
      setStaleCount(0);
      setRerankModalOpen(false);
      const count = data.reRanked as number;
      setRerankSuccess(`Re-ranked ${count} candidate${count !== 1 ? "s" : ""} against the updated JD.`);
      setTimeout(() => setRerankSuccess(null), 6000);
    } catch (e: unknown) {
      setRerankError(e instanceof Error ? e.message : "Re-rank failed — please try again");
    } finally {
      setIsReranking(false);
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
      {/* Back link + delete */}
      <div className="flex items-center justify-between">
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-600 transition-colors"
          aria-label="Delete job"
        >
          <Trash2 className="h-4 w-4" />
          Delete job
        </button>
      </div>

      {/* Editable job header */}
      <EditableJobHeader job={job} stats={stats} onSaveField={onSaveField} />

      {/* Bulk upload — uses latest job.description so ranking always uses current JD */}
      <BulkUploadZone
        jobDescription={job.description}
        jobId={jobId}
        onRankingComplete={(newCandidates) => setCandidates(newCandidates)}
      />

      {/* Re-rank success toast */}
      {rerankSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {rerankSuccess}
        </div>
      )}

      {/* JD change banner — shows when stale candidates exist */}
      {needsRerank && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-brand-amber/20 bg-brand-amber/5 px-4 py-3 text-sm">
          <p className="text-slate-700">
            Job description updated. Future uploads will be ranked against the new JD.{" "}
            <button
              type="button"
              onClick={() => setRerankModalOpen(true)}
              className="font-medium text-brand-amber hover:underline transition-colors"
            >
              Re-rank previous candidates
            </button>{" "}
            to update their scores.
          </p>
          <button
            type="button"
            onClick={() => setNeedsRerank(false)}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Re-rank confirmation modal */}
      {rerankModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => { if (!isReranking) setRerankModalOpen(false); }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-lg">Re-rank candidates?</h3>
              <p className="text-sm text-slate-600">
                Re-rank {staleCount} candidate{staleCount !== 1 ? "s" : ""} against the updated JD?
                Their notes and shortlist status will be preserved, but scores and AI insights will be updated.
              </p>
              {rerankError && <p className="text-xs text-red-500">{rerankError}</p>}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setRerankModalOpen(false); setRerankError(null); }}
                  disabled={isReranking}
                >
                  Cancel
                </Button>
                <Button variant="brand-primary" size="sm" onClick={handleRerank} disabled={isReranking}>
                  {isReranking ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Re-ranking…
                    </span>
                  ) : (
                    "Re-rank"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Candidates section */}
      {candidates.length === 0 ? (
        <div className="py-14 flex flex-col items-center text-center gap-2">
          <p className="text-slate-500 text-sm">
            Upload resumes above to start ranking candidates.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile filters trigger — hidden on md+ where sidebar is always visible */}
          <div className="md:hidden">
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(filters.score !== "all" || filters.status !== "all" || filters.search !== "") && (
                <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand-amber text-brand-navy text-[10px] font-bold">
                  {(filters.score !== "all" ? 1 : 0) + (filters.status !== "all" ? 1 : 0) + (filters.search !== "" ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-6 items-start">
            <aside className="hidden md:block w-52 shrink-0">
              <FiltersSidebar filters={filters} onChange={setFilters} />
            </aside>
            <div className="flex-1 min-w-0">
              <CandidateTable
                candidates={filteredCandidates}
                onView={setActiveCandidate}
                onStatusChange={handleStatusChange}
                tableError={tableError}
              />
            </div>
          </div>
        </>
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

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col md:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="font-semibold text-slate-900">Filters</span>
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FiltersSidebar filters={filters} onChange={setFilters} />
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <DeleteJobModal
          jobTitle={job.title}
          candidateCount={candidates.length}
          onConfirm={handleDeleteJob}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
