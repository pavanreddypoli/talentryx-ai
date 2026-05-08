"use client";

// D3 ships before D5 (create-job) and D6 (job-detail):
//   /recruiter/jobs/new    → 404 until D5
//   /recruiter/jobs/[id]   → 404 until D6

import Link from "next/link";
import { Briefcase, Users, Star, Clock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecruiterEmptyState from "@/components/recruiter/RecruiterEmptyState";

type JobStats = {
  total: number;
  shortlisted: number;
  rejected: number;
  pending: number;
};

type Job = {
  id: string;
  title: string;
  location: string | null;
  experience_level: string | null;
  status: string;
  created_at: string;
};

type Props = {
  fullName: string;
  today: string;
  stats: {
    activeJobs: number;
    totalCandidates: number;
    shortlisted: number;
    pending: number;
  };
  jobs: Job[];
  perJobStats: Record<string, JobStats>;
};

export default function RecruiterDashboardClient({
  fullName,
  today,
  stats,
  jobs,
  perJobStats,
}: Props) {
  const firstName = fullName.split(" ")[0] || fullName;

  return (
    <div className="space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {today} · Your pipeline at a glance
          </p>
        </div>
        {/* /recruiter/jobs/new is a 404 until D5 ships */}
        <Button variant="brand-primary" size="lg" asChild>
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create new job
          </Link>
        </Button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-brand-amber" />}
          value={stats.activeJobs}
          label="Active Jobs"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-brand-amber" />}
          value={stats.totalCandidates}
          label="Total Candidates"
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-brand-amber" />}
          value={stats.shortlisted}
          label="Shortlisted"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-brand-amber" />}
          value={stats.pending}
          label="Pending Review"
        />
      </div>

      {/* ── Jobs section ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
            Your jobs
          </h2>
          {jobs.length > 0 && (
            <Button variant="brand-dark" size="sm" asChild>
              <Link href="/recruiter/jobs/new">
                <Plus className="h-3.5 w-3.5" />
                Add job
              </Link>
            </Button>
          )}
        </div>

        {jobs.length === 0 ? (
          <RecruiterEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                stats={perJobStats[job.id] ?? { total: 0, shortlisted: 0, rejected: 0, pending: 0 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card variant="light-gradient" className="py-5">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className="font-display text-4xl font-bold text-brand-navy">{value}</p>
      </CardContent>
    </Card>
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

function JobCard({ job, stats }: { job: Job; stats: JobStats }) {
  const created = new Date(job.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const meta = [job.location, job.experience_level].filter(Boolean).join(" · ");

  return (
    // /recruiter/jobs/[jobId] is a 404 until D6 ships
    <Link href={`/recruiter/jobs/${job.id}`} className="block group">
      <Card
        variant="light-gradient"
        className="py-5 hover:shadow-md transition-shadow cursor-pointer group-hover:border-brand-amber/30"
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-brand-navy leading-snug group-hover:text-brand-amber transition-colors">
              {job.title}
            </h3>
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
        </CardContent>
      </Card>
    </Link>
  );
}
