"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, ChevronDown, Sparkles, Loader2, X } from "lucide-react";
import type { Job } from "@/lib/recruiter/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type EditableField = "title" | "location" | "experience_level" | "description";
type StatusOption = "open" | "closed" | "archived";

type Props = {
  job: Job;
  stats: { total: number; shortlisted: number; rejected: number };
  onSaveField: (field: string, value: string) => Promise<void>;
};

const STATUS_OPTIONS: StatusOption[] = ["open", "closed", "archived"];

const STATUS_STYLES: Record<StatusOption, { pill: string; dot: string; row: string }> = {
  open:     { pill: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", row: "text-emerald-700 hover:bg-emerald-50" },
  closed:   { pill: "bg-slate-200 text-slate-700 border border-slate-300",       dot: "bg-slate-400",   row: "text-slate-700 hover:bg-slate-50" },
  archived: { pill: "bg-slate-100 text-slate-500 border border-slate-200",       dot: "bg-slate-300",   row: "text-slate-500 hover:bg-slate-50" },
};

export default function EditableJobHeader({ job, stats, onSaveField }: Props) {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [pendingValue, setPendingValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showFullJD, setShowFullJD] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // AI state for JD editing
  const [isAiImproving, setIsAiImproving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genContext, setGenContext] = useState("");
  const [genRequirements, setGenRequirements] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  const statusRef = useRef<HTMLDivElement>(null);

  // Click-outside to close status dropdown
  useEffect(() => {
    if (!statusDropdownOpen) return;
    function handle(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [statusDropdownOpen]);

  function startEdit(field: EditableField, current: string) {
    setEditingField(field);
    setPendingValue(current ?? "");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingField(null);
    setPendingValue("");
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingField || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveField(editingField, pendingValue.trim());
      setEditingField(null);
      setPendingValue("");
    } catch {
      setEditError("Couldn't save — please try again");
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && editingField !== "description") {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  }

  async function handleStatusSelect(status: StatusOption) {
    setStatusDropdownOpen(false);
    try {
      await onSaveField("status", status);
    } catch {
      // onSaveField already reverted job state and set tableError banner
    }
  }

  async function handleAiImprove() {
    if (!pendingValue.trim()) return;
    setIsAiImproving(true);
    setAiError(null);
    try {
      const res = await fetch("/api/recruiter/jd/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingJd: pendingValue.trim(), title: job.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Improvement failed");
      setPendingValue(data.jdText);
    } catch {
      setAiError("AI improvement failed — please try again.");
    } finally {
      setIsAiImproving(false);
    }
  }

  async function handleAiGenerate() {
    setIsAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/recruiter/jd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: job.title,
          context: genContext.trim() || undefined,
          requirements: genRequirements.trim() || undefined,
          location: job.location ?? undefined,
          experienceLevel: job.experience_level ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPendingValue(data.jdText);
      setGenModalOpen(false);
      setGenContext("");
      setGenRequirements("");
    } catch {
      setAiError("AI generation failed — please try again.");
    } finally {
      setIsAiGenerating(false);
    }
  }

  const created = new Date(job.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const currentStatus = (job.status as StatusOption) ?? "open";
  const statusStyle = STATUS_STYLES[currentStatus] ?? STATUS_STYLES.closed;

  return (
    <Card variant="light-gradient">
      <CardContent className="space-y-3 py-5">

        {/* ── Title + status ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">

          {editingField === "title" ? (
            <div className="flex-1 min-w-0 space-y-2">
              <Input
                value={pendingValue}
                onChange={(e) => setPendingValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="font-display text-xl font-bold border-brand-amber/60 focus-visible:ring-brand-amber/50"
              />
              <SaveCancelRow onSave={saveEdit} onCancel={cancelEdit} isSaving={isSaving} error={editError} />
            </div>
          ) : (
            // Mobile: pencil icons currently only show on hover/tap-and-hold. Edge case for
            // recruiter UX (mostly desktop) — log as Issue 10 if confirmed needed:
            // "Inline-edit affordance for mobile."
            <div
              className="group flex items-center gap-2 cursor-pointer flex-1 min-w-0"
              onClick={() => startEdit("title", job.title)}
            >
              <h1 className="font-display text-2xl font-bold text-brand-navy truncate">
                {job.title}
              </h1>
              {editingField === null && (
                <Pencil className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </div>
          )}

          {/* Status pill + dropdown */}
          <div className="relative shrink-0" ref={statusRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${statusStyle.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
              {job.status}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleStatusSelect(opt)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${STATUS_STYLES[opt].row} ${opt === job.status ? "font-semibold" : ""}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[opt].dot}`} />
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Location · Experience level ─────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <InlineEditField
            value={job.location ?? ""}
            placeholder="Add location"
            isEditing={editingField === "location"}
            onStartEdit={() => startEdit("location", job.location ?? "")}
            pendingValue={pendingValue}
            onPendingChange={setPendingValue}
            onSave={saveEdit}
            onCancel={cancelEdit}
            onKeyDown={handleKeyDown}
            isSaving={isSaving}
            editError={editingField === "location" ? editError : null}
            suppressHover={editingField !== null}
          />
          {!editingField && (job.location || job.experience_level) && (
            <span className="text-sm text-slate-300">·</span>
          )}
          <InlineEditField
            value={job.experience_level ?? ""}
            placeholder="Add experience level"
            isEditing={editingField === "experience_level"}
            onStartEdit={() => startEdit("experience_level", job.experience_level ?? "")}
            pendingValue={pendingValue}
            onPendingChange={setPendingValue}
            onSave={saveEdit}
            onCancel={cancelEdit}
            onKeyDown={handleKeyDown}
            isSaving={isSaving}
            editError={editingField === "experience_level" ? editError : null}
            suppressHover={editingField !== null}
          />
        </div>

        {/* ── Stats row ───────────────────────────────────────────── */}
        <p className="text-xs text-slate-400">
          Created {created}
          {stats.total > 0 && (
            <>
              {" · "}{stats.total} candidate{stats.total !== 1 ? "s" : ""}
              {stats.shortlisted > 0 && (
                <span className="text-emerald-600"> · {stats.shortlisted} shortlisted</span>
              )}
              {stats.rejected > 0 && (
                <span className="text-red-500"> · {stats.rejected} rejected</span>
              )}
            </>
          )}
        </p>

        {/* ── JD section ──────────────────────────────────────────── */}
        {editingField === "description" ? (
          <div className="space-y-2">
            {/* AI buttons — only visible in edit mode */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setGenModalOpen(true); setAiError(null); }}
                disabled={isAiGenerating || isAiImproving}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-amber/40 bg-gradient-to-r from-brand-amber/5 to-orange-50 px-2.5 py-1 text-xs font-medium text-brand-amber hover:border-brand-amber/70 hover:from-brand-amber/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate JD
              </button>
              <button
                type="button"
                onClick={handleAiImprove}
                disabled={isAiImproving || isAiGenerating || !pendingValue.trim()}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-amber/40 bg-gradient-to-r from-brand-amber/5 to-orange-50 px-2.5 py-1 text-xs font-medium text-brand-amber hover:border-brand-amber/70 hover:from-brand-amber/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isAiImproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isAiImproving ? "Improving…" : "Improve with AI"}
              </button>
              {aiError && <p className="text-xs text-red-500">{aiError}</p>}
            </div>

            <Textarea
              value={pendingValue}
              onChange={(e) => setPendingValue(e.target.value)}
              autoFocus
              className="min-h-48 resize-y border-brand-amber/60 focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
            />
            <SaveCancelRow onSave={saveEdit} onCancel={cancelEdit} isSaving={isSaving} error={editError} saveLabel="Save JD" />
          </div>
        ) : (
          <div>
            <p className={`text-sm text-slate-600 whitespace-pre-line ${showFullJD ? "" : "line-clamp-3"}`}>
              {job.description}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <button type="button" onClick={() => setShowFullJD((v) => !v)} className="text-xs text-brand-amber hover:underline">
                {showFullJD ? "Show less" : "Show more"}
              </button>
              <button
                type="button"
                onClick={() => startEdit("description", job.description)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit JD
              </button>
            </div>
          </div>
        )}

      </CardContent>

      {/* Generate JD modal */}
      {genModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-amber" />
                <h2 className="text-sm font-semibold text-slate-900">Generate Job Description</h2>
              </div>
              <button
                type="button"
                onClick={() => setGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <p className="text-xs text-slate-500">
                AI will use the job title ({job.title})
                {job.location ? `, location (${job.location})` : ""}
                {job.experience_level ? `, experience level (${job.experience_level})` : ""}
                {" "}automatically. Add anything extra below.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  About the company / role (optional)
                </label>
                <Textarea
                  value={genContext}
                  onChange={(e) => setGenContext(e.target.value)}
                  placeholder="e.g. Fast-growing fintech startup, remote-first culture…"
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
                  placeholder="e.g. 5+ years React, TypeScript required…"
                  className="min-h-20 resize-y text-sm border-slate-200 focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGenModalOpen(false)}
                disabled={isAiGenerating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="brand-primary"
                size="sm"
                onClick={handleAiGenerate}
                disabled={isAiGenerating}
              >
                {isAiGenerating ? (
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
    </Card>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────

function SaveCancelRow({
  onSave, onCancel, isSaving, error, saveLabel = "Save",
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  error: string | null;
  saveLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="brand-primary" size="sm" onClick={onSave} disabled={isSaving}>
        {isSaving ? "Saving…" : saveLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

type InlineEditFieldProps = {
  value: string;
  placeholder: string;
  isEditing: boolean;
  onStartEdit: () => void;
  pendingValue: string;
  onPendingChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
  editError: string | null;
  suppressHover: boolean;
};

function InlineEditField({
  value, placeholder, isEditing, onStartEdit,
  pendingValue, onPendingChange, onSave, onCancel, onKeyDown,
  isSaving, editError, suppressHover,
}: InlineEditFieldProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={pendingValue}
          onChange={(e) => onPendingChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          placeholder={placeholder}
          className="w-44 h-7 py-0 text-sm border-brand-amber/60 focus-visible:ring-brand-amber/50"
        />
        <Button variant="brand-primary" size="sm" onClick={onSave} disabled={isSaving} className="h-7 text-xs px-2">
          {isSaving ? "…" : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving} className="h-7 text-xs px-2">
          Cancel
        </Button>
        {editError && <p className="text-xs text-red-500">{editError}</p>}
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1 cursor-pointer" onClick={onStartEdit}>
      <span className={`text-sm ${value ? "text-slate-500" : "text-slate-300 italic"}`}>
        {value || placeholder}
      </span>
      {!suppressHover && (
        <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}
