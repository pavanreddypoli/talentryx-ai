import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get all sessions for this user
  const { data: sessions, error } = await supabase
    .from("ranking_sessions")
    .select("id, job_description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        History
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        View your past resume ranking runs and revisit results anytime.
      </p>

      {!sessions || sessions.length === 0 ? (
        <Card className="border-dashed border-slate-300 dark:border-slate-600">
          <CardContent className="py-10 text-center text-slate-500 dark:text-slate-400">
            No history yet. Run your first AI ranking on the Dashboard.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/history/${s.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatDate(s.created_at)}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400">
                      View details →
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {s.job_description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
