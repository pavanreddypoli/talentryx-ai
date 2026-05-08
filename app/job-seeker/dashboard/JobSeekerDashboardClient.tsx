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

import {
  UploadCloud,
  Sparkles,
  Loader2,
  X,
  ClipboardList,
  FileUp,
  Target,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from "lucide-react";

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
   JOB SEEKER DASHBOARD CLIENT
------------------------------ */
export default function JobSeekerDashboardClient() {
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
      const res = await fetch("/api/ai/rewrite-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jd: jobDescription,
        }),
      });

      let data: any;
      try {
        data = await res.json();
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
      const res = await fetch("/api/ai/boost-to-80", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jd: jobDescription,
        }),
      });

      let data: any;
      try {
        data = await res.json();
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

      {/* AI RESULT MODAL */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-card border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <div className="text-xs font-semibold text-brand-amber uppercase tracking-wide">Talentryx AI</div>
                <div className="text-lg font-display font-semibold text-slate-800">{aiTitle}</div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="rounded-md p-2 hover:bg-brand-canvas"
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

            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAiOpen(false)}>
                Close
              </Button>
              <Button
                variant="brand-primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(aiContent || "");
                  } catch {
                    // ignore
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-2">
        <h1 className="font-display font-bold flex items-center gap-2 text-brand-navy">
          <Sparkles className="h-5 w-5 text-brand-amber" />
          Resume Match Analysis
        </h1>
        <span className="text-xs text-slate-400">Job Seeker Dashboard</span>
      </header>

      <section className="px-4 py-8 space-y-6">

        {/* HERO BANNER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-canvas via-amber-50 to-rose-50 px-8 py-10 rounded-2xl">
          <Sparkles className="absolute -right-4 -top-4 h-40 w-40 text-brand-amber/10 rotate-12 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-brand-navy leading-tight">
                Stand out. Get hired.
              </h2>
              <p className="mt-2 text-slate-600 max-w-md">
                Upload your resume, paste any job description, and get an instant AI-powered match score with personalized improvement tips.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-brand-navy/60">
              <div className="flex flex-col items-center gap-1">
                <ClipboardList className="h-8 w-8 text-brand-amber" />
                <span className="text-xs font-medium">Paste JD</span>
              </div>
              <ArrowRight className="h-5 w-5" />
              <div className="flex flex-col items-center gap-1">
                <FileUp className="h-8 w-8 text-brand-amber" />
                <span className="text-xs font-medium">Upload Resume</span>
              </div>
              <ArrowRight className="h-5 w-5" />
              <div className="flex flex-col items-center gap-1">
                <Target className="h-8 w-8 text-brand-amber" />
                <span className="text-xs font-medium">Get Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-amber text-brand-navy text-xs font-bold">1</span>
              <ClipboardList className="h-5 w-5 text-brand-amber" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Paste the Job Description</p>
            <p className="mt-1 text-xs text-slate-500">Copy the JD from any job board and paste it in the text area.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-amber text-brand-navy text-xs font-bold">2</span>
              <FileUp className="h-5 w-5 text-brand-amber" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Upload Your Resume</p>
            <p className="mt-1 text-xs text-slate-500">Upload your resume as PDF, DOCX, or DOC.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-amber text-brand-navy text-xs font-bold">3</span>
              <Target className="h-5 w-5 text-brand-amber" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Get Your Match Score</p>
            <p className="mt-1 text-xs text-slate-500">Receive an instant score, strengths, gaps, and AI-powered suggestions.</p>
          </div>
        </div>

        {/* INPUT CARD */}
        <Card variant="light-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-amber" />
              Your Resume Match Analysis
            </CardTitle>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6">
            <Textarea
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="h-[260px] border-slate-200 resize-none focus-visible:ring-brand-amber/50 focus-visible:border-brand-amber"
            />

            <div
              {...getRootProps()}
              className="border-dashed border-2 border-slate-300 hover:border-brand-amber p-6 text-center rounded-2xl cursor-pointer transition-colors"
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <>
                  <UploadCloud className="mx-auto mb-2 h-10 w-10 text-brand-amber/60" />
                  <p className="text-sm text-slate-600">Drop your resume here or click to browse</p>
                  <p className="mt-1 text-xs text-slate-400">PDF, DOCX, or DOC</p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                    {files[0].name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          <CardContent>
            <Button
              onClick={handleUpload}
              variant="brand-dark"
              className={`w-full ${files.length > 0 && !loading ? "animate-pulse-soft" : ""}`}
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
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-full bg-brand-amber transition-all rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Match Results</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber/10 px-3 py-1 text-xs font-medium text-brand-navy">
                  {results.length} resume{results.length !== 1 ? "s" : ""} analyzed
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Avg: {(results.reduce((sum, r) => sum + r.score * 100, 0) / results.length).toFixed(1)}%
                </span>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[14%] text-slate-700 font-semibold">Resume</TableHead>
                    <TableHead className="w-[32%] text-slate-700 font-semibold">Strengths</TableHead>
                    <TableHead className="w-[32%] text-slate-700 font-semibold">Gaps</TableHead>
                    <TableHead className="w-[8%] text-center text-slate-700 font-semibold">Score</TableHead>
                    <TableHead className="w-[14%] text-right text-slate-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {results.map((r, i) => {
                    const pct = r.score * 100;
                    const info = getScoreInfo(pct);

                    return (
                      <TableRow key={i} className="align-top hover:bg-brand-canvas">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-amber/20 text-brand-navy text-xs font-bold shrink-0">
                              {(r.candidate_name || r.file_name || "R").charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate">{r.candidate_name || r.file_name || "Resume"}</span>
                          </div>
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
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${info.className}`}
                          >
                            {pct >= 85 ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : pct >= 60 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {pct.toFixed(1)}%
                          </span>
                        </TableCell>

                        <TableCell className="text-right align-top">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-300 hover:bg-brand-canvas hover:border-brand-amber/50"
                              onClick={() => handleRewrite(r)}
                              disabled={aiWorking}
                            >
                              Rewrite with AI
                            </Button>

                            <Button
                              size="sm"
                              className="bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-semibold"
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
