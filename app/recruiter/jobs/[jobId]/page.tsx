import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect, notFound } from "next/navigation"; // notFound() for invalid/unowned jobId
import JobDetailClient from "./JobDetailClient";
import type { Job, Candidate } from "@/lib/recruiter/types";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ candidate?: string }>;
};

export default async function JobDetailPage({ params, searchParams }: Props) {
  const { jobId } = await params;
  const { candidate: initialCandidateId } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  // Query 1: job (RLS scopes to owner — returns null if not found or unowned)
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) notFound();

  // Query 2: session IDs for this job
  const { data: sessions } = await supabase
    .from("ranking_sessions")
    .select("id")
    .eq("job_id", jobId);

  const sessionIds = sessions?.map((s) => s.id) ?? [];

  // Query 3: candidates (empty-array guard — never call .in() with [])
  let initialCandidates: Candidate[] = [];
  if (sessionIds.length > 0) {
    const { data: candidates } = await supabase
      .from("ranking_results")
      .select(
        "id, session_id, candidate_name, file_name, score, keyword_match_percent, matched_keywords, missing_keywords, summary, status, recruiter_notes, created_at"
      )
      .in("session_id", sessionIds)
      .order("score", { ascending: false });

    initialCandidates = (candidates ?? []) as unknown as Candidate[];
  }

  return (
    <JobDetailClient
      initialJob={job as unknown as Job}
      initialCandidates={initialCandidates}
      jobId={jobId}
      initialCandidateId={initialCandidateId ?? null}
    />
  );
}
