import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  extractPdfText,
  extractDocText,
  extractDocxText,
} from "@/lib/resumeExtractor";

// -------------------------
function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildKeywords(jd: string) {
  const stopwords = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "for",
    "to",
    "of",
    "in",
    "with",
    "on",
    "at",
    "by",
    "is",
    "are",
    "as",
    "be",
    "this",
    "that",
    "will",
    "you",
    "we",
    "our",
    "your",
  ]);

  return jd
    .toLowerCase()
    .split(/[^a-z0-9+]+/g)
    .filter((t) => t.length >= 3 && !stopwords.has(t));
}

function computeMatch(jdKeywords: string[], resume: string) {
  const tokens = new Set(
    resume.toLowerCase().split(/[^a-z0-9+]+/g).filter((t) => t.length >= 3)
  );

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    if (tokens.has(kw)) matched.push(kw);
    else missing.push(kw);
  }

  const total = jdKeywords.length || 1;
  const matchPercent = Math.round((matched.length / total) * 100);

  return {
    matched,
    missing,
    matchPercent,
    score: matchPercent / 100,
  };
}

// -------------------------
// Insight helpers (unchanged)
// -------------------------
function pickTop(list: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
    if (out.length >= max) break;
  }
  return out;
}

function bucketize(keywords: string[]) {
  const buckets = {
    cloud: [] as string[],
    data: [] as string[],
    backend: [] as string[],
    frontend: [] as string[],
    devops: [] as string[],
    security: [] as string[],
    leadership: [] as string[],
    general: [] as string[],
  };

  const cloud = new Set(["aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "kubernetes", "k8s"]);
  const data = new Set(["sql", "postgres", "mysql", "mongodb", "etl", "warehouse", "snowflake", "bigquery", "spark"]);
  const backend = new Set(["node", "nodejs", "java", "spring", "python", "fastapi", "django", "api", "microservices"]);
  const frontend = new Set(["react", "nextjs", "next", "angular", "vue", "typescript", "javascript", "ui", "frontend"]);
  const devops = new Set(["docker", "ci", "cd", "cicd", "jenkins", "github", "gitlab", "terraform", "ansible"]);
  const security = new Set(["security", "oauth", "sso", "jwt", "hipaa", "pci", "gdpr", "soc2"]);
  const leadership = new Set(["lead", "leadership", "mentor", "stakeholder", "roadmap", "strategy", "ownership", "communication"]);

  for (const k of keywords) {
    const t = k.toLowerCase();
    if (cloud.has(t)) buckets.cloud.push(k);
    else if (data.has(t)) buckets.data.push(k);
    else if (backend.has(t)) buckets.backend.push(k);
    else if (frontend.has(t)) buckets.frontend.push(k);
    else if (devops.has(t)) buckets.devops.push(k);
    else if (security.has(t)) buckets.security.push(k);
    else if (leadership.has(t)) buckets.leadership.push(k);
    else buckets.general.push(k);
  }

  return buckets;
}

function makeInsights(
  name: string,
  matchPercent: number,
  matched: string[],
  missing: string[]
): { strengths: string[]; gaps: string[] } {
  const m = bucketize(matched);
  const g = bucketize(missing);

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (matchPercent >= 80) strengths.push("Strong alignment with the role requirements based on skills coverage.");
  else if (matchPercent >= 60) strengths.push("Good baseline alignment; core skills match many role requirements.");
  else strengths.push("Some alignment present, but key requirements appear to be missing or under-emphasized.");

  const strengthCats: Array<[string, string[]]> = [
    ["Relevant cloud/platform skills", m.cloud],
    ["Relevant data & database skills", m.data],
    ["Relevant backend/service skills", m.backend],
    ["Relevant frontend/UI skills", m.frontend],
    ["Relevant DevOps/tooling", m.devops],
    ["Relevant security/compliance", m.security],
    ["Leadership / ownership indicators", m.leadership],
  ];

  for (const [label, arr] of strengthCats) {
    const top = pickTop(arr, 4);
    if (top.length > 0) {
      strengths.push(`${label}: ${top.join(", ")}.`);
      break;
    }
  }

  strengths.push("Experience section can be strengthened further by adding measurable outcomes (impact, scale, metrics).");

  const gapCats: Array<[string, string[], string]> = [
    ["Cloud keywords", g.cloud, "Add cloud/platform keywords and examples where applicable."],
    ["Data/SQL keywords", g.data, "Add missing data/SQL terms and concrete examples of usage."],
    ["Backend/API keywords", g.backend, "Highlight backend/API work with specific technologies and responsibilities."],
    ["Frontend/UI keywords", g.frontend, "If relevant, include UI/frontend technologies and deliverables."],
    ["DevOps keywords", g.devops, "Mention CI/CD, containerization, and deployment practices if you have them."],
    ["Security/compliance keywords", g.security, "Include security/compliance keywords (and examples) if applicable."],
    ["Leadership indicators", g.leadership, "Add leadership/ownership examples (scope, decisions, mentoring, stakeholder management)."],
  ];

  for (const [label, arr, advice] of gapCats) {
    const top = pickTop(arr, 4);
    if (top.length > 0) {
      gaps.push(`${label} appear missing: ${top.join(", ")}. ${advice}`);
      break;
    }
  }

  gaps.push("Improve clarity by adding 1–2 quantified achievements per role.");

  return {
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
  };
}

// -------------------------
// MAIN HANDLER
// -------------------------
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const jobDescription = formData.get("jobDescription") as string;
    const files = formData.getAll("resumes") as File[];

    if (!jobDescription || files.length === 0) {
      return NextResponse.json({ error: "Missing job description or files" }, { status: 400 });
    }

    const jdText = normalizeText(jobDescription);
    const keywords = buildKeywords(jdText);

    const results: any[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const candidateName =
        file.name?.replace(/\.(pdf|docx|doc)$/i, "") || "Resume";

      let text = "";

      try {
        if (file.name.toLowerCase().endsWith(".pdf")) {
          text = await extractPdfText(buffer);
        } else if (file.name.toLowerCase().endsWith(".docx")) {
          text = await extractDocxText(buffer);
        } else if (file.name.toLowerCase().endsWith(".doc")) {
          text = await extractDocText(buffer);
        } else {
          text = buffer.toString("utf-8");
        }
      } catch (err) {
        console.error("Extraction failed for:", file.name, err);
        text = "";
      }

      text = normalizeText(text);

      const { matched, missing, matchPercent, score } = computeMatch(keywords, text);
      const { strengths, gaps } = makeInsights(candidateName, matchPercent, matched, missing);

      // ======================================================
      // ✅ ADDED FOR JOB SEEKER AI ACTIONS (ONLY ADDITION)
      // ======================================================
      const snippet = text.slice(0, 400);

      results.push({
        candidate_name: candidateName,
        file_name: file.name,

        // ✅ REQUIRED by Rewrite with AI / Boost to 80+
        full_text: text,
        snippet,

        score,
        keyword_match_percent: matchPercent,
        strengths,
        gaps,
      });
    }

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("ERROR /api/rank:", err);
    return NextResponse.json({ error: "Ranking failed" }, { status: 500 });
  }
}
