import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HistoryDetailClient from "./HistoryDetailClient";

type Params = Promise<{ sessionId: string }>;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function HistoryDetailPage({ params }: { params: Params }) {
  const { sessionId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // CRITICAL: user.id is auth.users.id — do NOT use public.users.id (Issue 3 dual identity tables).
  // RLS on ranking_sessions enforces auth.uid() = user_id, so other users' sessions return null.
  const { data: session } = await supabase
    .from("ranking_sessions")
    .select("id, job_description, created_at, ranking_results(*)")
    .eq("id", sessionId)
    .is("job_id", null) // extra guard: reject recruiter sessions even if RLS somehow passes them
    .single();

  if (!session) notFound();

  // Job-seeker sessions have exactly one ranking_result per session (single-resume upload).
  const results = session.ranking_results as {
    score: number | null;
    file_name: string | null;
    summary: string[] | null;
    missing_keywords: string[] | null;
  }[];
  const result = results?.[0] ?? null;

  // TODO: parse job title from JD using AI or regex pattern matching for cleaner display titles. Polish item.
  const displayTitle =
    session.job_description.slice(0, 60).trim() +
    (session.job_description.length > 60 ? "…" : "");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/job-seeker/history"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-amber transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 leading-snug">
          {displayTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(session.created_at)}
          {result?.file_name ? ` · ${result.file_name}` : ""}
        </p>
      </div>

      {result ? (
        <HistoryDetailClient
          score={Number(result.score ?? 0)}
          summary={result.summary ?? []}
          missingKeywords={result.missing_keywords ?? []}
          jobDescription={session.job_description}
          fileName={result.file_name ?? null}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No result data available for this session.</p>
        </div>
      )}
    </div>
  );
}
