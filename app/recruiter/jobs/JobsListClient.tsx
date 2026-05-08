"use client";

// D4 ships before D5 (create-job) and D6 (job-detail):
//   /recruiter/jobs/new    → 404 until D5
//   /recruiter/jobs/[id]   → 404 until D6

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecruiterEmptyState from "@/components/recruiter/RecruiterEmptyState";
import type { JobRow, JobStats } from "@/lib/recruiter/jobStats";

type Props = {
  displayJobs: JobRow[];
  perJobStats: Record<string, JobStats>;
  statusCounts: { open: number; closed: number; archived: number };
  hasAnyJobs: boolean;
  currentStatus: string | null;
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
}: Props) {
  const subtitle = [
    `${statusCounts.open} active`,
    `${statusCounts.closed} closed`,
    `${statusCounts.archived} archived`,
  ].join(" · ");

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
        {/* /recruiter/jobs/new is a 404 until D5 ships */}
        <Button variant="brand-primary" size="lg" asChild>
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create new job
          </Link>
        </Button>
      </div>

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
      {!hasAnyJobs ? (
        <RecruiterEmptyState />
      ) : displayJobs.length === 0 ? (
        <FilterEmptyState currentStatus={currentStatus} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              stats={perJobStats[job.id] ?? { total: 0, shortlisted: 0, rejected: 0, pending: 0 }}
            />
          ))}
        </div>
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

function JobCard({ job, stats }: { job: JobRow; stats: JobStats }) {
  const created = new Date(job.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const meta = [job.location, job.experience_level].filter(Boolean).join(" · ");

  return (
    <Card
      variant="light-gradient"
      className="py-5 hover:shadow-md transition-shadow group"
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          {/* /recruiter/jobs/[jobId] is a 404 until D6 ships */}
          <Link href={`/recruiter/jobs/${job.id}`} className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-brand-navy leading-snug group-hover:text-brand-amber transition-colors">
              {job.title}
            </h3>
          </Link>
          <StatusPill status={job.status} />
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
          {/* /recruiter/jobs/[jobId] is a 404 until D6 ships */}
          <Button variant="brand-dark" size="sm" asChild>
            <Link href={`/recruiter/jobs/${job.id}`}>View →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
