"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Users, Star, Clock, Plus, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecruiterEmptyState from "@/components/recruiter/RecruiterEmptyState";
import DeleteJobModal from "@/components/recruiter/DeleteJobModal";

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
  jobs: initialJobs,
  perJobStats,
}: Props) {
  const firstName = fullName.split(" ")[0] || fullName;

  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [localStats, setLocalStats] = useState(stats);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleDeleteConfirm() {
    if (!deletingJob) return;
    const res = await fetch(`/api/recruiter/jobs/${deletingJob.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Delete failed — please try again");
    }

    const jobStats = perJobStats[deletingJob.id] ?? { total: 0, shortlisted: 0, rejected: 0, pending: 0 };

    setJobs((prev) => prev.filter((j) => j.id !== deletingJob.id));
    setLocalStats((prev) => ({
      activeJobs: deletingJob.status === "open" ? Math.max(0, prev.activeJobs - 1) : prev.activeJobs,
      totalCandidates: Math.max(0, prev.totalCandidates - jobStats.total),
      shortlisted: Math.max(0, prev.shortlisted - jobStats.shortlisted),
      pending: Math.max(0, prev.pending - jobStats.pending),
    }));

    const title = deletingJob.title;
    setDeletingJob(null);
    setSuccessMessage(`"${title}" deleted.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

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
        <Button variant="brand-primary" size="lg" asChild>
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create new job
          </Link>
        </Button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="h-5 w-5 text-brand-amber" />} value={localStats.activeJobs} label="Active Jobs" />
        <StatCard icon={<Users className="h-5 w-5 text-brand-amber" />} value={localStats.totalCandidates} label="Total Candidates" />
        <StatCard icon={<Star className="h-5 w-5 text-brand-amber" />} value={localStats.shortlisted} label="Shortlisted" />
        <StatCard icon={<Clock className="h-5 w-5 text-brand-amber" />} value={localStats.pending} label="Pending Review" />
      </div>

      {/* ── Success banner ────────────────────────────────────── */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

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
                onDeleteClick={() => setDeletingJob(job)}
              />
            ))}
          </div>
        )}
      </div>

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

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card variant="light-gradient" className="py-5">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.closed}`}>
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
  job: Job;
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
            <h3 className="font-display text-base font-semibold text-brand-navy leading-snug group-hover:text-brand-amber transition-colors">
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
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
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
      </CardContent>
    </Card>
  );
}
