"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FormErrors = {
  title?: string;
  description?: string;
};

export default function CreateJobClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim() || undefined,
          experience_level: experienceLevel.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // "Recruiter account not found" maps to Issue 4 in known_issues.md — orphaned auth user
        // without a public.users row. Out of scope for D5; tracked separately.
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // /recruiter/jobs/[id] doesn't exist yet (D6) — this redirect will land on a 404 until D6 ships.
      // D6 must handle the empty-candidates case (newly created job has zero candidates).
      router.push(`/recruiter/jobs/${data.job.id}`);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Back link */}
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
          Create a new job
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up the role, paste the JD, and start ranking candidates.
        </p>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Job title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber dark:bg-slate-900 dark:text-slate-100 ${
              errors.title
                ? "border-red-400 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Job description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Job description <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the full job description here…"
            className={`min-h-64 resize-y ${
              errors.description
                ? "border-red-400 bg-red-50 focus-visible:ring-red-400/50 focus-visible:border-red-400"
                : "border-slate-200 focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
            }`}
          />
          {errors.description ? (
            <p className="text-xs text-red-500">{errors.description}</p>
          ) : (
            <p className="text-xs text-slate-400">
              Paste the entire JD — we'll match candidates against everything you include.
            </p>
          )}
        </div>

        {/* Optional details */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">Optional details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco or Remote"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="experience_level" className="text-sm font-medium text-slate-700">
                Experience level
              </label>
              <input
                id="experience_level"
                type="text"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                placeholder="e.g. Senior, Mid, Entry, 5+ years"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" type="button" asChild>
            <Link href="/recruiter/jobs">Cancel</Link>
          </Button>
          <Button variant="brand-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create job →"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
