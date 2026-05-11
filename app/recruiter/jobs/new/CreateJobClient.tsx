"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, X } from "lucide-react";
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

  // AI state
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genContext, setGenContext] = useState("");
  const [genRequirements, setGenRequirements] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [prevDescription, setPrevDescription] = useState<string | null>(null);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/recruiter/jd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          context: genContext.trim() || undefined,
          requirements: genRequirements.trim() || undefined,
          location: location.trim() || undefined,
          experienceLevel: experienceLevel.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDescription(data.jdText);
      setGenerateModalOpen(false);
      setGenContext("");
      setGenRequirements("");
    } catch {
      // keep modal open; user can retry
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImprove() {
    if (!description.trim()) return;
    setIsImproving(true);
    try {
      const res = await fetch("/api/recruiter/jd/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingJd: description.trim(),
          title: title.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Improvement failed");
      setPrevDescription(description);
      setDescription(data.jdText);
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = setTimeout(() => setPrevDescription(null), 5000);
    } catch {
      // silent — description unchanged
    } finally {
      setIsImproving(false);
    }
  }

  function handleRestore() {
    if (prevDescription !== null) {
      setDescription(prevDescription);
      setPrevDescription(null);
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    }
  }

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
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/recruiter/jobs/${data.job.id}`);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canGenerate = title.trim() !== "";
  const canImprove = description.trim() !== "";

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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">
              Job description <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGenerateModalOpen(true)}
                disabled={!canGenerate}
                title={!canGenerate ? "Add a job title first" : "Generate JD with AI"}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-amber/40 bg-gradient-to-r from-brand-amber/5 to-orange-50 px-2.5 py-1 text-xs font-medium text-brand-amber hover:border-brand-amber/70 hover:from-brand-amber/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate JD
              </button>
              <button
                type="button"
                onClick={handleImprove}
                disabled={!canImprove || isImproving}
                title={!canImprove ? "Add a job description first" : "Improve JD with AI"}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-amber/40 bg-gradient-to-r from-brand-amber/5 to-orange-50 px-2.5 py-1 text-xs font-medium text-brand-amber hover:border-brand-amber/70 hover:from-brand-amber/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isImproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isImproving ? "Improving…" : "Improve with AI"}
              </button>
            </div>
          </div>

          {/* Restore bar */}
          {prevDescription !== null && (
            <div className="flex items-center justify-between rounded-md border border-brand-amber/30 bg-brand-amber/5 px-3 py-2 text-xs text-slate-600">
              <span>JD improved by AI.</span>
              <button
                type="button"
                onClick={handleRestore}
                className="font-medium text-brand-amber hover:underline"
              >
                Restore original
              </button>
            </div>
          )}

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

      {/* Generate JD modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-amber" />
                <h2 className="text-sm font-semibold text-slate-900">Generate Job Description</h2>
              </div>
              <button
                type="button"
                onClick={() => setGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <p className="text-xs text-slate-500">
                AI will use your job title
                {location.trim() ? `, location (${location.trim()})` : ""}
                {experienceLevel.trim() ? `, experience level (${experienceLevel.trim()})` : ""}
                {" "}automatically. Add anything extra below.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  About the company / role (optional)
                </label>
                <Textarea
                  value={genContext}
                  onChange={(e) => setGenContext(e.target.value)}
                  placeholder="e.g. Fast-growing fintech startup, remote-first culture, building next-gen payments infrastructure…"
                  className="min-h-20 resize-y text-sm border-slate-200 focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Key requirements (optional)
                </label>
                <Textarea
                  value={genRequirements}
                  onChange={(e) => setGenRequirements(e.target.value)}
                  placeholder="e.g. 5+ years React, TypeScript required, experience with distributed systems a plus…"
                  className="min-h-20 resize-y text-sm border-slate-200 focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGenerateModalOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="brand-primary"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
