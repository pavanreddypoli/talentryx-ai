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

import { Upload, FileText, Sparkles, Loader2, Wand2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* -----------------------------
   Score badge logic
------------------------------ */
function getScoreInfo(score: number) {
  if (score >= 85) {
    return {
      label: "Strong match",
      className:
        "bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse",
    };
  } else if (score >= 60) {
    return {
      label: "Potential fit",
      className:
        "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse",
    };
  } else {
    return {
      label: "Low match",
      className: "bg-rose-100 text-rose-700 border border-rose-200",
    };
  }
}

/* -----------------------------
   MAIN DASHBOARD CLIENT
------------------------------ */
export default function DashboardClient() {
  // Core state
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Success animation trigger
  const [success, setSuccess] = useState(false);

  // Animated progress bar
  const [progress, setProgress] = useState(0);

  // View mode
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modal for resume analysis
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  /* -----------------------------
     NEW AI MODAL STATES
  ------------------------------ */
  const [rewriteResumeOpen, setRewriteResumeOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [rewriteJDOpen, setRewriteJDOpen] = useState(false);

  // Score Improvement States
  const [beforeScore, setBeforeScore] = useState<number | null>(null);
  const [afterScore, setAfterScore] = useState<number | null>(null);
  const [scoreAttempts, setScoreAttempts] = useState<number | null>(null);
  const [boostTo80Text, setBoostTo80Text] = useState("");
  const [boostTo80Open, setBoostTo80Open] = useState(false);

  const [rewriteResumeText, setRewriteResumeText] = useState("");
  const [boostedResumeText, setBoostedResumeText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [rewriteJDText, setRewriteJDText] = useState("");

  const [aiLoading, setAiLoading] = useState(false);

  /* -----------------------------
     DIFF STATE (Side-by-Side)
  ------------------------------ */
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffData, setDiffData] = useState<any[]>([]);
  const [originalText, setOriginalText] = useState("");
  const [updatedText, setUpdatedText] = useState("");

  /* -----------------------------
     FILE DROP HANDLING
  ------------------------------ */
  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
    },
  });

  /* -----------------------------
     RUN AI RANKING
  ------------------------------ */
  const handleUpload = async () => {
    if (!jobDescription || files.length === 0) {
      alert("Please provide a job description and upload resumes.");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setResults([]);
    setProgress(0);

    const interval = setInterval(
      () => setProgress((p) => (p < 95 ? p + Math.random() * 10 : p)),
      250
    );

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      files.forEach((f) => formData.append("resumes", f));

      const res = await fetch("/api/rank", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        alert(data.error || "Failed to rank resumes.");
        setLoading(false);
        setProgress(0);
        return;
      }

      setResults(data.results || []);
      setLoading(false);

      setSuccess(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.4 } });

      setTimeout(() => setProgress(0), 1200);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setProgress(0);
      alert("Something went wrong while ranking resumes.");
    }
  };

  /* -----------------------------
     AI CALL HELPERS
  ------------------------------ */
  async function callAI(
    endpoint: string,
    payload: any,
    setText: (value: string) => void,
    openSetter: (value: boolean) => void
  ) {
    try {
      setAiLoading(true);
      const res = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setAiLoading(false);

      if (!res.ok) {
        alert(data.error || "AI failed");
        return;
      }

      // Determine original text for diff (resume or JD)
      const baseOriginal =
        typeof payload.resume === "string"
          ? payload.resume
          : typeof payload.jd === "string"
          ? payload.jd
          : "";

      setOriginalText(baseOriginal);
      setUpdatedText(data.text || "");

      if (baseOriginal && data.text) {
        import("../../lib/diffText")
          .then(({ diffText }) => {
            const d = diffText(baseOriginal, data.text);
            setDiffData(d);
          })
          .catch((e) => {
            console.error("Diff module load error:", e);
            setDiffData([]);
          });
      } else {
        setDiffData([]);
      }

      // show the rewritten text in its modal
      setText(data.text);
      openSetter(true);
    } catch (err) {
      setAiLoading(false);
      alert("AI request failed.");
    }
  }

  async function boostToEighty(resumeText: string) {
    try {
      setAiLoading(true);

      const res = await fetch("/api/boost-to-80", {
        method: "POST",
        body: JSON.stringify({
          resume: resumeText,
          jd: jobDescription,
        }),
      });

      const data = await res.json();
      setAiLoading(false);

      if (!res.ok) {
        alert(data.error || "Failed to auto-boost resume.");
        return;
      }

      setBeforeScore(data.beforeScore);
      setAfterScore(data.afterScore);
      setScoreAttempts(data.attempts);
      setBoostTo80Text(data.text || "");

      // also prep diff for this flow
      setOriginalText(resumeText);
      setUpdatedText(data.text || "");

      if (resumeText && data.text) {
        import("../../lib/diffText")
          .then(({ diffText }) => {
            const d = diffText(resumeText, data.text);
            setDiffData(d);
          })
          .catch((e) => {
            console.error("Diff error in boost-to-80:", e);
            setDiffData([]);
          });
      }

      setBoostTo80Open(true);
    } catch (err) {
      setAiLoading(false);
      alert("Auto boost request failed.");
    }
  }

  /* -----------------------------
     DOWNLOAD REWRITTEN DOCX
  ------------------------------ */
  async function downloadRewrittenDocx(source: "selected" | "modal") {
    try {
      const baseText =
        source === "modal" ? rewriteResumeText : selected?.full_text;

      if (!baseText) {
        alert("No resume text available to generate DOCX.");
        return;
      }

      setAiLoading(true);

      const res = await fetch("/api/rewrite-resume-docx", {
        method: "POST",
        body: JSON.stringify({
          resume: baseText,
          jd: jobDescription,
          candidateName: selected?.candidate_name || "candidate",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiLoading(false);
        alert(data.error || "Failed to generate DOCX file.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        selected?.candidate_name || "resume"
      }-ai-rewritten.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setAiLoading(false);
    } catch (err) {
      console.error("DOCX download error:", err);
      setAiLoading(false);
      alert("Something went wrong while generating DOCX.");
    }
  }

  /* -----------------------------
     MODAL: DETAILS WITH AI BUTTONS
  ------------------------------ */
  const DetailsModal = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {selected?.candidate_name}
          </DialogTitle>
          <DialogDescription>
            Full resume analysis & AI insights
          </DialogDescription>
        </DialogHeader>

        {selected && (
          <div className="space-y-6">
            {/* SCORE BADGE + AI BUTTONS */}
            <div className="flex justify-between items-center">
              {(() => {
                const pct = selected.score * 100;
                const { label, className } = getScoreInfo(pct);
                return (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}
                  >
                    {label} • {pct.toFixed(1)}%
                  </span>
                );
              })()}

              {/* AI BUTTONS */}
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiLoading}
                  onClick={() =>
                    callAI(
                      "/api/rewrite-resume",
                      { resume: selected.full_text, jd: jobDescription },
                      setRewriteResumeText,
                      setRewriteResumeOpen
                    )
                  }
                >
                  <Wand2 className="h-4 w-4 mr-1" /> Rewrite Resume
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiLoading}
                  onClick={() =>
                    callAI(
                      "/api/boost-resume",
                      { resume: selected.full_text, jd: jobDescription },
                      setBoostedResumeText,
                      setBoostOpen
                    )
                  }
                >
                  <Wand2 className="h-4 w-4 mr-1" /> Boost Score
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiLoading}
                  onClick={() =>
                    callAI(
                      "/api/summary",
                      { resume: selected.full_text },
                      setSummaryText,
                      setSummaryOpen
                    )
                  }
                >
                  <Wand2 className="h-4 w-4 mr-1" /> Summary
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  disabled={aiLoading}
                  onClick={() => boostToEighty(selected.full_text)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  Auto-Boost to 80+
                </Button>

                {/* Rewrite + Download DOCX (from original resume) */}
                <Button
                  size="sm"
                  variant="default"
                  disabled={aiLoading}
                  onClick={() => downloadRewrittenDocx("selected")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Wand2 className="h-4 w-4 mr-1" /> Rewrite + DOCX
                </Button>
              </div>
            </div>

            {/* FULL TEXT */}
            <div>
              <h3 className="font-semibold mb-2 text-slate-800">
                Full Resume Text
              </h3>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700">
                {selected.full_text}
              </p>
            </div>

            {/* MATCH INSIGHTS */}
            <div className="border-t pt-4 space-y-6">
              <h3 className="font-semibold text-slate-800">
                AI Match Insights
              </h3>

              {/* Match % */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Keyword Match Coverage
                </p>

                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${selected.keyword_match_percent}%`,
                    }}
                  ></div>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {selected.keyword_match_percent}% of JD keywords found.
                </p>
              </div>

              {/* Strengths */}
              <div>
                <p className="text-sm font-semibold text-emerald-700 mb-1">
                  Strengths (Matched Skills)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.matched_keywords
                    .slice(0, 20)
                    .map((k: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs"
                      >
                        {k}
                      </span>
                    ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <p className="text-sm font-semibold text-rose-700 mb-1">
                  Missing / Weak Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.missing_keywords
                    .slice(0, 20)
                    .map((k: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs"
                      >
                        {k}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  /* -----------------------------
     4 AI OUTPUT MODALS + BOOST TO 80
  ------------------------------ */
  const RewriteResumeModal = (
    <Dialog open={rewriteResumeOpen} onOpenChange={setRewriteResumeOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Rewritten Resume</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <pre className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-slate-50 max-h-[60vh] overflow-auto">
            {rewriteResumeText}
          </pre>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!rewriteResumeText}
              onClick={() => setDiffOpen(true)}
            >
              View Side-by-Side Diff
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={aiLoading || !rewriteResumeText}
              onClick={() => downloadRewrittenDocx("modal")}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Download as DOCX
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const BoostModal = (
    <Dialog open={boostOpen} onOpenChange={setBoostOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Boosted Resume (Higher Score)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <pre className="whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto border rounded-md p-3 bg-slate-50">
            {boostedResumeText}
          </pre>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!boostedResumeText}
              onClick={() => setDiffOpen(true)}
            >
              View Side-by-Side Diff
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const SummaryModal = (
    <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Recruiter Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <pre className="whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto border rounded-md p-3 bg-slate-50">
            {summaryText}
          </pre>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!summaryText}
              onClick={() => setDiffOpen(true)}
            >
              View Side-by-Side Diff
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const RewriteJDModal = (
    <Dialog open={rewriteJDOpen} onOpenChange={setRewriteJDOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Rewritten Job Description</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <pre className="whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto border rounded-md p-3 bg-slate-50">
            {rewriteJDText}
          </pre>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!rewriteJDText}
              onClick={() => setDiffOpen(true)}
            >
              View Side-by-Side Diff
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const BoostTo80Modal = (
    <Dialog open={boostTo80Open} onOpenChange={setBoostTo80Open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Score Booster Results</DialogTitle>
          <DialogDescription>
            Resume rewritten until score reached <strong>80+</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Score comparison */}
          {beforeScore !== null && afterScore !== null && (
            <div className="bg-slate-50 p-4 rounded-lg border">
              <p className="text-sm font-semibold text-slate-700">
                Score Improvement
              </p>
              <p className="mt-2 text-sm">
                <span className="font-bold text-rose-600">Before:</span>{" "}
                {beforeScore.toFixed(1)}%
              </p>
              <p className="text-sm">
                <span className="font-bold text-emerald-600">After:</span>{" "}
                {afterScore.toFixed(1)}%
              </p>

              <p className="text-xs mt-2 text-slate-500">
                Improved in <strong>{scoreAttempts}</strong> rewrite attempt(s)
              </p>

              <div className="mt-3">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    afterScore >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Final Score: {afterScore.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Updated resume */}
          <pre className="whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto border rounded-md p-3 bg-white">
            {boostTo80Text}
          </pre>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!boostTo80Text}
              onClick={() => setDiffOpen(true)}
            >
              View Side-by-Side Diff
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* -----------------------------
     DIFF MODAL (Side-by-Side)
  ------------------------------ */
  const DiffModal = (
    <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resume Changes (Side-by-Side Diff)</DialogTitle>
          <DialogDescription>
            See exactly what changed between the original and rewritten version.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Original */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="font-semibold mb-2 text-slate-800">Original Text</h3>
            <pre className="text-xs whitespace-pre-wrap max-h-[60vh] overflow-auto">
              {originalText}
            </pre>
          </div>

          {/* Updated with colored diff */}
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-2 text-slate-800">
              AI-Rewritten Text
            </h3>

            <div className="text-xs whitespace-pre-wrap leading-5 max-h-[60vh] overflow-auto">
              {diffData.map((d, idx) => {
                if (d.type === "same") {
                  return <span key={idx}>{d.text} </span>;
                }
                if (d.type === "added") {
                  return (
                    <span
                      key={idx}
                      className="bg-green-200 text-green-900 font-semibold px-1 rounded"
                    >
                      {d.text}{" "}
                    </span>
                  );
                }
                if (d.type === "removed") {
                  return (
                    <span
                      key={idx}
                      className="bg-red-200 text-red-900 line-through px-1 rounded"
                    >
                      {d.text}{" "}
                    </span>
                  );
                }
                if (d.type === "modified") {
                  return (
                    <span
                      key={idx}
                      className="bg-yellow-200 text-yellow-800 px-1 rounded"
                    >
                      {d.text}{" "}
                    </span>
                  );
                }
                return <span key={idx}>{d.text} </span>;
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* -----------------------------
     SKELETON LOADERS
  ------------------------------ */
  const SkeletonLoader = (
    <div className="space-y-6 mt-10">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-slate-200 shadow-sm bg-white"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /* -----------------------------
     RENDER UI
  ------------------------------ */
  return (
    <>
      <SparkleSuccess trigger={success} />

      {DetailsModal}
      {RewriteResumeModal}
      {BoostModal}
      {SummaryModal}
      {RewriteJDModal}
      {BoostTo80Modal}
      {DiffModal}

      <div className="min-h-screen">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg rounded-lg">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              TalentRank AI
            </h1>
            <span className="text-xs text-indigo-100">Premium Dashboard</span>
          </div>
        </header>

        <section className="px-4 py-8 space-y-6">
          {/* WORKSPACE CARD */}
          <Card className="shadow-xl border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-indigo-700">
                AI Resume Ranking Workspace
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* JOB DESCRIPTION */}
                <div>
                  <h2 className="font-semibold text-slate-800 mb-2">
                    1. Job Description
                  </h2>

                  {/* Rewrite JD button */}
                  <div className="flex justify-end mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={aiLoading}
                      onClick={() =>
                        callAI(
                          "/api/rewrite-jd",
                          { jd: jobDescription },
                          setRewriteJDText,
                          setRewriteJDOpen
                        )
                      }
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      Rewrite JD (AI)
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Paste job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="h-[300px] overflow-y-auto resize-none"
                  >
                  </Textarea>
                </div>

                {/* RESUME UPLOAD */}
                <div>
                  <h2 className="font-semibold text-slate-800 mb-2">
                    2. Upload Resumes
                  </h2>

                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-300 bg-white hover:border-indigo-400"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto mb-2 h-8 w-8 text-indigo-600" />
                    <p className="text-sm text-slate-600">
                      {isDragActive
                        ? "Drop the resumes here…"
                        : "Drag & drop resumes or click to upload"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      (PDF or DOCX formats)
                    </p>
                  </div>

                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {files.map((file, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <FileText className="h-4 w-4 text-indigo-600" />
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* SUBMIT */}
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm font-semibold"
                onClick={handleUpload}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ranking candidates…
                  </span>
                ) : (
                  "Run AI Ranking"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* PROGRESS BAR */}
          {loading && (
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* SKELETON */}
          {loading && SkeletonLoader}

          {/* RESULTS */}
          {!loading && results.length > 0 && (
            <Card className="shadow-xl border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-indigo-700">
                  Ranked Candidates
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* VIEW MODE TOGGLE */}
                <div className="flex justify-end mb-4 gap-2">
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    onClick={() => setViewMode("table")}
                  >
                    Table View
                  </Button>

                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    onClick={() => setViewMode("cards")}
                  >
                    Card View
                  </Button>
                </div>

                {/* CARD VIEW */}
                {viewMode === "cards" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((r, i) => {
                      const pct = r.score * 100;
                      const { label, className } = getScoreInfo(pct);

                      return (
                        <div
                          key={i}
                          className="bg-white border border-slate-200 shadow-md rounded-xl p-5 hover:shadow-lg transition flex flex-col justify-between"
                          onClick={() => {
                            setSelected(r);
                            setOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${className}`}
                            >
                              {label} • {pct.toFixed(1)}%
                            </span>

                            {r.storage_path && r.file_name && (
                              <DownloadResumeButton
                                storagePath={r.storage_path}
                                fileName={r.file_name}
                              />
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-slate-800 mt-1">
                            {r.candidate_name}
                          </h3>

                          <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                            {r.snippet}
                          </p>

                          <div className="mt-3">
                            <p className="text-xs text-slate-500">
                              Keyword Match:{" "}
                              <span className="font-semibold text-indigo-600">
                                {r.keyword_match_percent}%
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TABLE VIEW */}
                {viewMode === "table" && (
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-indigo-50 text-indigo-700">
                        <TableHead className="w-[18%] font-semibold">
                          Candidate
                        </TableHead>
                        <TableHead className="w-[40%] font-semibold">
                          Summary Snippet
                        </TableHead>
                        <TableHead className="w-[10%] text-center font-semibold">
                          Score
                        </TableHead>
                        <TableHead className="w-[12%] text-center font-semibold">
                          Resume
                        </TableHead>
                        <TableHead className="w-[20%] text-right font-semibold">
                          AI Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {results.map((r, i) => {
                        const pct = r.score * 100;
                        const { label, className } = getScoreInfo(pct);

                        return (
                          <TableRow
                            key={i}
                            className="hover:bg-indigo-50/50 transition cursor-pointer"
                            onClick={() => {
                              setSelected(r);
                              setOpen(true);
                            }}
                          >
                            {/* Candidate Name */}
                            <TableCell className="font-medium text-slate-800 text-sm">
                              {r.candidate_name}
                            </TableCell>

                            {/* Summary Snippet */}
                            <TableCell className="text-xs text-slate-600 max-w-[350px] whitespace-normal leading-4 line-clamp-2">
                              {r.snippet}
                            </TableCell>

                            {/* Score */}
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-slate-500">
                                  {pct.toFixed(1)}%
                                </span>

                                <span
                                  className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${className}`}
                                >
                                  {label}
                                </span>

                                {r.new_score && (
                                  <span className="text-[10px] text-emerald-700 font-semibold">
                                    New: {r.new_score}%
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Resume Download Button */}
                            <TableCell className="text-center">
                              {r.storage_path && r.file_name ? (
                                <DownloadResumeButton
                                  storagePath={r.storage_path}
                                  fileName={r.file_name}
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  No file
                                </span>
                              )}
                            </TableCell>

                            {/* AI ACTIONS */}
                            <TableCell className="text-right">
                              <div className="flex flex-col gap-1 items-end">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    callAI(
                                      "/api/rewrite-resume",
                                      {
                                        resume: r.full_text,
                                        jd: jobDescription,
                                      },
                                      setRewriteResumeText,
                                      setRewriteResumeOpen
                                    );
                                  }}
                                  className="text-[10px] h-7 px-2"
                                >
                                  Rewrite
                                </Button>

                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    callAI(
                                      "/api/boost-resume",
                                      {
                                        resume: r.full_text,
                                        jd: jobDescription,
                                      },
                                      setBoostedResumeText,
                                      setBoostOpen
                                    );
                                  }}
                                  className="text-[10px] h-7 px-2"
                                >
                                  Boost
                                </Button>

                                <Button
                                  size="xs"
                                  variant="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    boostToEighty(r.full_text);
                                  }}
                                  className="text-[10px] h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
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
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
