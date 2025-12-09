import DownloadResumeButton from "@/components/DownloadResumeButton";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Link from "next/link";

function getScoreInfo(score: number) {
  if (score >= 0.85) {
    return {
      label: "Strong match",
      className:
        "bg-emerald-100 text-emerald-700 border border-emerald-200",
    };
  } else if (score >= 0.6) {
    return {
      label: "Potential fit",
      className:
        "bg-amber-100 text-amber-700 border border-amber-200",
    };
  } else {
    return {
      label: "Low match",
      className: "bg-rose-100 text-rose-700 border border-rose-200",
    };
  }
}

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  // ⬅️ FIX: unwrap async route params
  const { sessionId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Load ranking session
  const { data: sessionRow, error: sessionError } = await supabase
    .from("ranking_sessions")
    .select("id, job_description, created_at")
    .eq("id", sessionId)
    .single();

  if (sessionError || !sessionRow) {
    console.error("Error fetching session:", sessionError);
    redirect("/dashboard/history");
  }

  // Load ranking results
  const { data: results, error: resultsError } = await supabase
    .from("ranking_results")
    .select("*")
    .eq("session_id", sessionId)
    .order("score", { ascending: false });

  if (resultsError) {
    console.error("Error fetching results:", resultsError);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Run Details
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {new Date(sessionRow.created_at).toLocaleString()}
          </p>
        </div>

        <Link
          href="/dashboard/history"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to History
        </Link>
      </div>

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Job Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {sessionRow.job_description}
          </p>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Ranked Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!results || results.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No results found for this run.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-50">
                  <TableHead className="font-semibold text-indigo-700">
                    Candidate
                  </TableHead>
                  <TableHead className="font-semibold text-indigo-700">
                    Summary Snippet
                  </TableHead>
                  <TableHead className="font-semibold text-indigo-700 text-right">
                    Score
                  </TableHead>
                  <TableHead className="font-semibold text-indigo-700 text-right">
                    Resume
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {results.map((r) => {
                  const pct = Number(r.score || 0) * 100;
                  const { label, className } = getScoreInfo(Number(r.score || 0));

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{r.candidate_name}</span>
                          <span className="text-[11px] text-slate-400">{r.file_name}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs max-w-md line-clamp-3 break-words whitespace-normal text-slate-600">
                        {r.snippet}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-slate-500">
                            {pct.toFixed(1)}%
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${className}`}
                          >
                            {label}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Keywords: {r.keyword_match_percent}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DownloadResumeButton path={r.storage_path} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
