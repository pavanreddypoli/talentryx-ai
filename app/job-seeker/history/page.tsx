import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

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

function scoreBadgeClasses(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-rose-50 text-rose-700 border border-rose-200";
}

export default async function JobSeekerHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // CRITICAL: user.id is auth.users.id — ranking_sessions.user_id references auth.users.id directly.
  // Do NOT use public.users.id here — they are different UUIDs (Issue 3 dual identity tables).
  const [sessionsResult, countResult] = await Promise.all([
    supabase
      .from("ranking_sessions")
      .select("id, job_description, created_at, ranking_results(score, file_name)")
      .eq("user_id", user.id)
      .is("job_id", null) // job-seeker sessions only — recruiter sessions always have a non-null job_id
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from("ranking_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("job_id", null),
  ]);

  const sessions = sessionsResult.data ?? [];
  const total = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">History</h1>
        <p className="mt-1 text-sm text-slate-500">Your past match analyses</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-brand-amber/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-brand-amber" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">No matches yet</h2>
          <p className="text-sm text-slate-500 mb-6">
            Start by uploading your resume against a job description.
          </p>
          <Link
            href="/job-seeker/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-brand-amber px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-amber-300 transition-colors"
          >
            Get your first match score
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session) => {
              const results = session.ranking_results as { score: number | null; file_name: string | null }[];
              const result = results?.[0] ?? null;
              const score = result?.score != null ? Number(result.score) : null;
              const jdPreview =
                session.job_description.length > 80
                  ? session.job_description.slice(0, 80).trim() + "…"
                  : session.job_description;

              return (
                <Link
                  key={session.id}
                  href={`/job-seeker/history/${session.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs text-slate-400">
                          {formatDate(session.created_at)}
                        </span>
                        {result?.file_name && (
                          <span className="text-xs text-slate-400 truncate">
                            · {result.file_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {jdPreview}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {score !== null && (
                        <span
                          className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${scoreBadgeClasses(score)}`}
                        >
                          {score}%
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-400 group-hover:text-brand-amber transition-colors flex items-center gap-0.5">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              {page > 1 ? (
                <Link
                  href={`/job-seeker/history?page=${page - 1}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <div />
              )}

              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={`/job-seeker/history?page=${page + 1}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
