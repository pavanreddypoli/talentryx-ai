"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import confetti from "canvas-confetti";
import SparkleSuccess from "@/components/SparkleSuccess";
import DownloadResumeButton from "@/components/DownloadResumeButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Upload, Sparkles, Loader2, X } from "lucide-react";

/* -----------------------------
   Score badge logic
------------------------------ */
function getScoreInfo(score: number) {
  if (score >= 85)
    return {
      label: "Strong match",
      className: "bg-emerald-100 text-emerald-700",
    };
  if (score >= 60)
    return {
      label: "Potential fit",
      className: "bg-amber-100 text-amber-700",
    };
  return {
    label: "Low match",
    className: "bg-rose-100 text-rose-700",
  };
}

/* -----------------------------
   MAIN DASHBOARD CLIENT
------------------------------ */
export default function DashboardClient() {
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [aiWorking, setAiWorking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const onDrop = (accepted: File[]) => setFiles(accepted);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
    },
  });

  async function handleUpload() {
    if (!jobDescription || !files.length) {
      alert("Upload your resume and paste a job description.");
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress(0);

    const interval = setInterval(
      () => setProgress((p) => Math.min(p + Math.random() * 12, 95)),
      300
    );

    try {
      const fd = new FormData();
      fd.append("jobDescription", jobDescription);
      files.forEach((f) => fd.append("resumes", f));

      const res = await fetch("/api/rank", { method: "POST", body: fd });
      const data = await res.json();

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) throw new Error(data.error);

      setResults(data.results || []);
      setSuccess(true);
      confetti({ particleCount: 120, spread: 80 });
    } catch {
      alert("Ranking failed.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }

  function openAiModal(title: string) {
    setAiTitle(title);
    setAiContent("");
    setAiError(null);
    setAiOpen(true);
  }

  // =========================
  // 🔧 FIXED: Rewrite with AI
  // =========================
  async function handleRewrite(r: any) {
    if (!jobDescription?.trim()) {
      alert("Please paste a job description first.");
      return;
    }

    const resumeText = (r?.full_text || r?.snippet || "").toString().trim();
    if (!resumeText) {
      alert("Could not find resume text for this entry. Please re-run analysis.");
      return;
    }

    openAiModal("Rewrite with AI");
    setAiWorking(true);

    try {
      const res = await fetch("/api/ai/rewrite-resume", { // 🔧 FIX
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jd: jobDescription,
        }),
      });

      let data: any;
      try {
        data = await res.json(); // 🔧 FIX (guarded)
      } catch {
        throw new Error("AI service returned empty response");
      }

      if (!res.ok) throw new Error(data?.error || "Rewrite failed");

      setAiContent(data?.text || "");
    } catch (e: any) {
      setAiError(e?.message || "Rewrite failed.");
    } finally {
      setAiWorking(false);
    }
  }

  // =========================
  // 🔧 FIXED: Boost to 80+
  // =========================
  async function handleBoost(r: any) {
    if (!jobDescription?.trim()) {
      alert("Please paste a job description first.");
      return;
    }

    const resumeText = (r?.full_text || r?.snippet || "").toString().trim();
    if (!resumeText) {
      alert("Could not find resume text for this entry. Please re-run analysis.");
      return;
    }

    openAiModal("Boost to 80+");
    setAiWorking(true);

    try {
      const res = await fetch("/api/ai/boost-to-80", { // 🔧 FIX
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jd: jobDescription,
        }),
      });

      let data: any;
      try {
        data = await res.json(); // 🔧 FIX (guarded)
      } catch {
        throw new Error("AI service returned empty response");
      }

      if (!res.ok) throw new Error(data?.error || "Boost failed");

      setAiContent(data?.text || "");
    } catch (e: any) {
      setAiError(e?.message || "Boost failed.");
    } finally {
      setAiWorking(false);
    }
  }

  return (
    <>
      <SparkleSuccess trigger={success} />

      {/* ✅ NEW: AI RESULT MODAL (simple + safe, no extra deps) */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <div className="text-sm text-slate-500">Talentryx AI</div>
                <div className="text-lg font-semibold">{aiTitle}</div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="rounded-md p-2 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              {aiWorking && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </div>
              )}

              {aiError && (
                <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {aiError}
                </div>
              )}

              {!aiWorking && !aiError && aiContent && (
                <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-800">
                  {aiContent}
                </pre>
              )}

              {!aiWorking && !aiError && !aiContent && (
                <div className="mt-3 text-sm text-slate-500">
                  Output will appear here.
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAiOpen(false)}>
                Close
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(aiContent || "");
                  } catch {
                    // ignore
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg shadow">
        <div className="px-6 py-4 flex justify-between">
          <h1 className="font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            Talentryx AI
          </h1>
          <span className="text-xs opacity-80">Job Seeker Dashboard</span>
        </div>
      </header>

      <section className="px-4 py-8 space-y-6">
        {/* INPUT CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Your Resume Match Analysis</CardTitle>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6">
            <Textarea
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="h-[260px]"
            />

            <div
              {...getRootProps()}
              className="border-dashed border-2 p-6 text-center rounded-lg cursor-pointer"
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-2 text-indigo-600" />
              <p className="text-sm">Upload your resume (PDF/DOCX/DOC)</p>

              {files.length > 0 && (
                <div className="mt-3 text-xs text-slate-600">
                  <p className="font-medium mb-1">Uploaded resumes:</p>
                  <ul className="list-disc ml-5">
                    {files.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>

          <CardContent>
            <Button
              onClick={handleUpload}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "Get Match Score"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* PROGRESS */}
        {loading && (
          <div className="h-3 bg-slate-200 rounded">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Match Results</CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[14%]">Resume</TableHead>
                    <TableHead className="w-[32%]">Strengths</TableHead>
                    <TableHead className="w-[32%]">Gaps</TableHead>
                    <TableHead className="w-[8%] text-center">Score</TableHead>
                    <TableHead className="w-[14%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {results.map((r, i) => {
                    const pct = r.score * 100;
                    const info = getScoreInfo(pct);

                    return (
                      <TableRow key={i} className="align-top">
                        <TableCell className="font-medium">
                          {r.candidate_name || r.file_name || "Resume"}
                        </TableCell>

                        <TableCell className="whitespace-normal break-words">
                          <ul className="list-disc ml-4 text-sm space-y-1">
                            {r.strengths?.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </TableCell>

                        <TableCell className="whitespace-normal break-words">
                          <ul className="list-disc ml-4 text-sm space-y-1">
                            {r.gaps?.map((g: string, idx: number) => (
                              <li key={idx}>{g}</li>
                            ))}
                          </ul>
                        </TableCell>

                        <TableCell className="text-center align-top">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${info.className}`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </TableCell>

                        <TableCell className="text-right align-top">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRewrite(r)}
                              disabled={aiWorking}
                            >
                              Rewrite with AI
                            </Button>

                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleBoost(r)}
                              disabled={aiWorking}
                            >
                              Boost to 80+
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}
