"use client";

import { useState } from "react";
import DashboardClient from "@/app/dashboard/DashboardClient"; // ✅ NEW: reuse recruiter features

export default function JobSeekerDashboard() {
  // ─────────────────────────────────────
  // Existing state (UNCHANGED)
  // ─────────────────────────────────────
  const [resume, setResume] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");

  // ─────────────────────────────────────
  // NEW: Added state (ADDITIVE ONLY)
  // ─────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────
  // NEW: Handler for Get Match Score
  // ─────────────────────────────────────
  async function handleGetMatchScore() {
    if (!jobDesc) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/job-seeker/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDesc,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get match score");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Something went wrong while calculating the match score.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-2">
          Resume Match Dashboard
        </h1>
        <p className="text-slate-600 mb-6">
          Upload your resume and paste the job description to see how well you
          match.
        </p>

        {/* Resume Upload (UNCHANGED) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Your Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
          />
        </div>

        {/* Job Description (UNCHANGED) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Job Description
          </label>
          <textarea
            rows={6}
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="Paste the job description here..."
          />
        </div>

        {/* CTA (ENHANCED, NOT REMOVED) */}
        <button
          disabled={!resume || !jobDesc || loading}
          onClick={handleGetMatchScore}
          className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-md
                     hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Get Match Score"}
        </button>

        {/* Existing placeholder (KEPT) */}
        <div className="mt-6 text-sm text-slate-500">
          Match score & feedback will appear here.
        </div>

        {/* NEW: Error */}
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {/* NEW: Result */}
        {result && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">
              Match Score: {result.score}%
            </h2>

            <p className="mb-3 text-slate-700">{result.summary}</p>

            {result.strengths && (
              <div className="mb-3">
                <strong>Strengths</strong>
                <ul className="list-disc ml-5 text-slate-700">
                  {result.strengths.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.gaps && (
              <div>
                <strong>Gaps</strong>
                <ul className="list-disc ml-5 text-slate-700">
                  {result.gaps.map((g: string, i: number) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ NEW: Reuse recruiter dashboard feature panels (Boost to 80+, Rewrite with AI, ATS, History, etc.) */}
      <div className="max-w-5xl mx-auto mt-8">
        <DashboardClient />
      </div>
    </main>
  );
}
