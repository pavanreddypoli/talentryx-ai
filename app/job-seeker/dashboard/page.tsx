"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JobSeekerDashboard() {
  const router = useRouter();

  // 🔒 ROLE GUARD — block recruiters
  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user_type !== "job_seeker") {
          router.replace("/dashboard");
        }
      });
  }, [router]);

  // ─────────────────────────────────────
  // Existing code (UNCHANGED)
  // ─────────────────────────────────────
  const [resume, setResume] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-2xl font-bold text-indigo-700 mb-2">
          Resume Match Dashboard
        </h1>
        <p className="text-slate-600 mb-6">
          Upload your resume and paste the job description to see how well you match.
        </p>

        {/* Resume Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Your Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
          />
        </div>

        {/* Job Description */}
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

        {/* CTA */}
        <button
          disabled={!resume || !jobDesc}
          className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-md
                     hover:bg-indigo-700 disabled:opacity-50"
        >
          Get Match Score
        </button>

        {/* Placeholder */}
        <div className="mt-6 text-sm text-slate-500">
          Match score & feedback will appear here.
        </div>
      </div>
    </main>
  );
}
