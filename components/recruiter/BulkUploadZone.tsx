"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Candidate } from "@/lib/recruiter/types";

type Props = {
  jobDescription: string;
  jobId: string;
  onRankingComplete: (candidates: Candidate[]) => void;
};

type Progress = { done: number; total: number };

export default function BulkUploadZone({ jobDescription, jobId, onRankingComplete }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0 });
  const [dropErrors, setDropErrors] = useState<string[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of accepted) {
      if (f.size > 10 * 1024 * 1024) {
        errors.push(`${f.name} exceeds 10 MB — skipped`);
      } else {
        valid.push(f);
      }
    }
    setFiles((prev) => [...prev, ...valid]);
    setDropErrors(errors);
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
    },
    multiple: true,
  });

  async function handleRank() {
    if (!files.length || isRanking) return;
    setIsRanking(true);
    setDropErrors([]);
    setProgress({ done: 0, total: files.length });

    // TODO: Persist upload state across page closes (Issue: ranked candidates
    // persist in DB but UI loses track if tab closed mid-loop)
    const rankErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append("jobDescription", jobDescription);
      fd.append("resumes", files[i]);
      fd.append("jobId", jobId);
      try {
        const res = await fetch("/api/rank", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          if (data.extractionErrors?.length) {
            rankErrors.push(...data.extractionErrors);
          }
        }
      } catch (err) {
        console.error(`Failed to rank ${files[i].name}:`, err);
      }
      setProgress({ done: i + 1, total: files.length });
    }

    if (rankErrors.length > 0) {
      setDropErrors(rankErrors);
    }

    // Refresh the full candidates list from DB after all files are ranked
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}/candidates`);
      if (res.ok) {
        const data = await res.json();
        onRankingComplete(data.candidates ?? []);
      }
    } catch (err) {
      console.error("Failed to refresh candidates after ranking:", err);
    }

    setFiles([]);
    setIsRanking(false);
    setProgress({ done: 0, total: 0 });
  }

  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card variant="light-gradient">
      <CardContent className="py-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Upload Resumes</h2>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-dashed border-2 rounded-2xl p-6 text-center transition-colors cursor-pointer ${
            files.length > 0
              ? "border-brand-amber bg-brand-amber/5"
              : "border-slate-300 hover:border-brand-amber"
          }`}
        >
          <input {...getInputProps()} />

          {files.length === 0 ? (
            <>
              <UploadCloud className="mx-auto mb-2 h-10 w-10 text-brand-amber/60" />
              <p className="text-sm text-slate-600">Drop resumes here or click to browse</p>
              <p className="mt-1 text-xs text-slate-400">PDF, DOCX, DOC · max 10 MB per file</p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                {files.length} resume{files.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {files.slice(0, 8).map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 text-xs text-slate-600"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate max-w-[140px]">{f.name}</span>
                  </span>
                ))}
                {files.length > 8 && (
                  <span className="inline-flex items-center bg-slate-100 rounded-full px-2 py-0.5 text-xs text-slate-500">
                    +{files.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Validation errors */}
        {dropErrors.length > 0 && (
          <div className="space-y-1">
            {dropErrors.map((e, i) => (
              <p key={i} className="text-xs text-red-500">
                {e}
              </p>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {isRanking && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-amber" />
                Ranking {progress.done} of {progress.total}…
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-amber transition-all duration-300 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions row */}
        {files.length > 0 && !isRanking && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              + Add more files
            </button>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setDropErrors([]);
              }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
            <Button
              variant="brand-primary"
              size="sm"
              onClick={handleRank}
              className="ml-auto"
            >
              Rank {files.length > 1 ? `all ${files.length}` : "1"} →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
