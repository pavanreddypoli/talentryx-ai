"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecruiterEmptyState from "@/components/recruiter/RecruiterEmptyState";
import DeleteJobModal from "@/components/recruiter/DeleteJobModal";
import type { JobRow, JobStats } from "@/lib/recruiter/jobStats";

type Props = {
  displayJobs: JobRow[];
  perJobStats: Record<string, JobStats>;
  statusCounts: { open: number; closed: number; archived: number };
  hasAnyJobs: boolean;
  currentStatus: string | null;
  showDeletedBanner?: boolean;
};

const FILTER_PILLS = [
  { label: "All", status: null },
  { label: "Open", status: "open" },
  { label: "Closed", status: "closed" },
  { label: "Archived", status: "archived" },
] as const;

export default function JobsListClient({
  displayJobs,
  perJobStats,
  statusCounts,
  hasAnyJobs,
  currentStatus,
  showDeletedBanner = false,
}: Props) {
  const [jobs, setJobs] = useState<JobRow[]>(displayJobs);
  const [counts, setCounts] = useState(statusCounts);
  const [deletingJob, setDeletingJob] = useState<JobRow | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    showDeletedBanner ? "Job deleted successfully." : null
  );

  // Auto-dismiss the server-rendered deleted banner
  useEffect(() => {
    if (!showDeletedBanner) return;
    const t = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(t);
  }, [showDeletedBanner]);

  const subtitle = [
    `${counts.open} active`,
    `${counts.closed} closed`,
    `${counts.archived} archived`,
  ].join(" · ");

  async function handleDeleteConfirm() {
    if (!deletingJob) return;
    const res = await fetch(`/api/recruiter/jobs/${deletingJob.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Delete failed — please try again");
    }
    // API success: remove from local state
    setJobs((prev) => prev.filter((j) => j.id !== deletingJob.id));
    setCounts((prev) => ({
      ...prev,
      [deletingJob.status as keyof typeof prev]:
        Math.max(0, (prev[deletingJob.status as keyof typeof prev] ?? 1) - 1),
    }));
    const title = deletingJob.title;
    setDeletingJob(null);
    setSuccessMessage(`"${title}" deleted.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  // Displayed jobs come from local state (mirrors displayJobs but removable)
  const displayedJobs =
    !currentStatus || currentStatus === "all"
      ? jobs.filter((j) => j.status !== "archived")
      : jobs.filter((j) => j.status === currentStatus);

  return (
    <div className="space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <Button variant="brand-primary" size="lg" asChild>
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create new job
          </Link>
        </Button>
      </div>

      {/* ── Success banner ────────────────────────────────────── */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* ── Filter pills ──────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_PILLS.map((pill) => {
          const isActive =
            pill.status === null
              ? !currentStatus || currentStatus === "all"
              : currentStatus === pill.status;
          const href = pill.status
            ? `/recruiter/jobs?status=${pill.status}`
            : "/recruiter/jobs";

          return (
            <Link
              key={pill.label}
              href={href}
              className={`
                inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition
                ${
                  isActive
                    ? "bg-brand-amber text-brand-navy font-semibold shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-brand-canvas dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                }
              `}
            >
              {pill.label}
            </Link>
          );
        })}
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      {!hasAnyJobs && jobs.length === 0 ? (
        <RecruiterEmptyState />
      ) : displayedJobs.length === 0 ? (
        <FilterEmptyState currentStatus={currentStatus} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              stats={perJobStats[job.id] ?? { total: 0, shortlisted: 0, rejected: 0, pending: 0 }}
              onDeleteClick={() => setDeletingJob(job)}
            />
          ))}
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────── */}
      {deletingJob && (
        <DeleteJobModal
          jobTitle={deletingJob.title}
          candidateCount={perJobStats[deletingJob.id]?.total ?? 0}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingJob(null)}
        />
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function FilterEmptyState({ currentStatus }: { currentStatus: string | null }) {
  const message =
    !currentStatus || currentStatus === "all"
      ? "No active or closed jobs"
      : `No jobs with status "${currentStatus}"`;

  return (
    <div className="py-12 flex flex-col items-center gap-3 text-center">
      <p className="text-slate-500 text-sm">{message}</p>
      <Link
        href="/recruiter/jobs"
        className="text-sm text-brand-amber font-medium hover:underline"
      >
        ← Show all jobs
      </Link>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
    archived: "bg-slate-100 text-slate-400",
  };
  const dotStyles: Record<string, string> = {
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
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] ?? dotStyles.closed}`} />
      {status}
    </span>
  );
}

function JobCard({
  job,
  stats,
  onDeleteClick,
}: {
  job: JobRow;
  stats: JobStats;
  onDeleteClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const created = new Date(job.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const meta = [job.location, job.experience_level].filter(Boolean).join(" · ");

  return (
    <Card variant="light-gradient" className="py-5 hover:shadow-md transition-shadow group">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/recruiter/jobs/${job.id}`} className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-brand-navy leading-snug group-hover:text-brand-amber transition-colors">
              {job.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusPill status={job.status} />
            {/* 3-dot menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Job options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                    <button
                      onClick={() => { setMenuOpen(false); onDeleteClick(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete job
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {meta && <p className="text-xs text-slate-500">{meta}</p>}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span>{stats.total} candidate{stats.total !== 1 ? "s" : ""}</span>
            {stats.shortlisted > 0 && (
              <span className="text-emerald-600"> · {stats.shortlisted} shortlisted</span>
            )}
            {stats.rejected > 0 && (
              <span className="text-red-500"> · {stats.rejected} rejected</span>
            )}
          </div>
          <span className="text-xs text-slate-400">Created {created}</span>
        </div>

        <div className="pt-1">
          <Button variant="brand-dark" size="sm" asChild>
            <Link href={`/recruiter/jobs/${job.id}`}>View →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
