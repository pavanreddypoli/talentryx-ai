-- Composite index for job-seeker history list query: filters by user_id and sorts by created_at DESC.
-- Without this, the query does a full table scan on ranking_sessions.
CREATE INDEX IF NOT EXISTS idx_ranking_sessions_user_created
  ON public.ranking_sessions (user_id, created_at DESC);
