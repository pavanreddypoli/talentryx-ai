"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, FileText } from "lucide-react";

// Identical bucketing logic to CandidateDrawer — keep in sync if categories change.
function buildProseGaps(missingKeywords: string[]): string[] {
  const cloud = new Set(["aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "kubernetes", "k8s"]);
  const data = new Set(["sql", "postgres", "mysql", "mongodb", "etl", "warehouse", "snowflake", "bigquery", "spark"]);
  const backend = new Set(["node", "nodejs", "java", "spring", "python", "fastapi", "django", "api", "microservices"]);
  const frontend = new Set(["react", "nextjs", "next", "angular", "vue", "typescript", "javascript", "ui", "frontend"]);
  const devops = new Set(["docker", "ci", "cd", "cicd", "jenkins", "github", "gitlab", "terraform", "ansible"]);
  const security = new Set(["security", "oauth", "sso", "jwt", "hipaa", "pci", "gdpr", "soc2"]);
  const leadership = new Set(["lead", "leadership", "mentor", "stakeholder", "roadmap", "strategy", "ownership", "communication"]);

  const buckets: Record<string, string[]> = {
    "Cloud/platform keywords": [],
    "Data/SQL keywords": [],
    "Backend/API keywords": [],
    "Frontend/UI keywords": [],
    "DevOps/tooling keywords": [],
    "Security/compliance keywords": [],
    "Leadership indicators": [],
    "Other gaps": [],
  };

  const advice: Record<string, string> = {
    "Cloud/platform keywords": "Add cloud/platform examples where applicable.",
    "Data/SQL keywords": "Add concrete examples of data/SQL usage.",
    "Backend/API keywords": "Highlight backend/API work with specific technologies.",
    "Frontend/UI keywords": "Include UI/frontend technologies if relevant.",
    "DevOps/tooling keywords": "Mention CI/CD and containerization practices.",
    "Security/compliance keywords": "Include security/compliance examples if applicable.",
    "Leadership indicators": "Add leadership/ownership examples (scope, decisions, mentoring).",
    "Other gaps": "Review the job description and address missing terms directly.",
  };

  for (const kw of missingKeywords) {
    const t = kw.toLowerCase();
    if (cloud.has(t)) buckets["Cloud/platform keywords"].push(kw);
    else if (data.has(t)) buckets["Data/SQL keywords"].push(kw);
    else if (backend.has(t)) buckets["Backend/API keywords"].push(kw);
    else if (frontend.has(t)) buckets["Frontend/UI keywords"].push(kw);
    else if (devops.has(t)) buckets["DevOps/tooling keywords"].push(kw);
    else if (security.has(t)) buckets["Security/compliance keywords"].push(kw);
    else if (leadership.has(t)) buckets["Leadership indicators"].push(kw);
    else buckets["Other gaps"].push(kw);
  }

  const result: string[] = [];
  for (const [cat, kws] of Object.entries(buckets)) {
    if (kws.length === 0) continue;
    const top = kws.slice(0, 4).join(", ");
    result.push(`${cat} appear missing: ${top}. ${advice[cat]}`);
    if (result.length >= 3) break;
  }
  return result;
}

function scoreTier(score: number): { label: string; classes: string } {
  if (score >= 80) return { label: "Strong Fit", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  if (score >= 60) return { label: "Potential Fit", classes: "bg-amber-50 text-amber-700 border border-amber-200" };
  return { label: "Weak Fit", classes: "bg-rose-50 text-rose-700 border border-rose-200" };
}

type Props = {
  score: number;
  summary: string[];
  missingKeywords: string[];
  jobDescription: string;
  fileName: string | null;
};

export default function HistoryDetailClient({
  score,
  summary,
  missingKeywords,
  jobDescription,
  fileName,
}: Props) {
  const [jdExpanded, setJdExpanded] = useState(false);

  const tier = scoreTier(score);
  const proseGaps = buildProseGaps(missingKeywords);

  const jdPreview = jobDescription.slice(0, 200);
  const jdNeedsToggle = jobDescription.length > 200;

  return (
    <div className="space-y-5">
      {/* Score card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center gap-5">
        <div className={`text-3xl font-bold tabular-nums px-4 py-2 rounded-xl ${tier.classes}`}>
          {score}%
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-900">{tier.label}</div>
          <div className="text-sm text-slate-500 mt-0.5">Resume match score</div>
        </div>
      </div>

      {/* Strengths */}
      {summary.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Strengths
          </h2>
          <ul className="space-y-2.5">
            {summary.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {proseGaps.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Gaps to address
          </h2>
          <ul className="space-y-2.5">
            {proseGaps.map((gap, i) => (
              <li key={i} className="text-sm text-slate-600 leading-relaxed">
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Job description (collapsible) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Job Description
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {jdExpanded ? jobDescription : jdPreview}
          {!jdExpanded && jdNeedsToggle && "…"}
        </p>
        {jdNeedsToggle && (
          <button
            onClick={() => setJdExpanded(!jdExpanded)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {jdExpanded ? (
              <>
                Show less <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Show full JD <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Resume filename — read-only, no download.
          storage_path is not persisted for job-seeker sessions (/api/rank without recruiter context). */}
      {fileName && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3">
          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-500">{fileName}</span>
        </div>
      )}
    </div>
  );
}
