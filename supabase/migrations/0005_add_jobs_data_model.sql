-- =================================================================
-- supabase/migrations/0005_add_jobs_data_model.sql
--
-- Adds the jobs data model for recruiter-owned job postings.
-- Each job stores its description (JD) and drives downstream
-- ranking sessions and candidate status tracking.
--
-- Changes:
--   A. CREATE TABLE public.jobs
--   B. Indexes on jobs.recruiter_id and jobs.status
--   C. ADD COLUMN ranking_sessions.job_id  (nullable FK → jobs)
--   D. ADD COLUMN ranking_results.status + recruiter_notes
--   E. RLS policies on jobs
--   F. updated_at trigger on jobs
--
-- Schema notes (confirmed against live DB 2026-05-07):
--   • public.users.id is a custom UUID with no FK to auth.users.id.
--     RLS on jobs therefore joins through public.users.email to
--     resolve the recruiter's id from the JWT, following the same
--     pattern established in 0003_add_users_rls_policies.sql.
--   • ranking_sessions.user_id references auth.users.id (not
--     public.users.id). The existing session ownership policies
--     (0004) use auth.uid() = user_id and are unaffected.
--   • ranking_results already has full_text, matched_keywords,
--     missing_keywords, summary columns in production (not in 0001).
--     This migration does not touch those columns.
--
-- Idempotency: safe to re-run.
--   CREATE TABLE / ADD COLUMN use IF NOT EXISTS.
--   DROP POLICY IF EXISTS precedes every CREATE POLICY.
--   DROP TRIGGER IF EXISTS precedes the trigger.
--   CREATE OR REPLACE FUNCTION for the trigger function.
-- =================================================================


-- =================================================================
-- A. CREATE TABLE public.jobs
-- =================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL,  -- the full JD text
  location         TEXT,
  experience_level TEXT,                  -- free text: "Senior", "Mid", "Entry", etc.
  status           TEXT        NOT NULL DEFAULT 'open'
                               CHECK (status IN ('open', 'closed', 'archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =================================================================
-- B. Indexes on jobs
-- =================================================================

-- Recruiters list their own jobs: WHERE recruiter_id = $id
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id
  ON public.jobs (recruiter_id);

-- Recruiters filter by status: WHERE recruiter_id = $id AND status = 'open'
CREATE INDEX IF NOT EXISTS idx_jobs_status
  ON public.jobs (status);


-- =================================================================
-- C. Add job_id to ranking_sessions
--
-- Nullable: existing sessions were created without a job reference.
-- ON DELETE SET NULL: deleting a job preserves historical session
-- data — the session simply becomes detached from its job.
-- =================================================================

ALTER TABLE public.ranking_sessions
  ADD COLUMN IF NOT EXISTS job_id UUID
    REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ranking_sessions_job_id
  ON public.ranking_sessions (job_id);


-- =================================================================
-- D. Add status and recruiter_notes to ranking_results
--
-- status:          recruiter's disposition on this candidate
-- recruiter_notes: free-form text annotation (nullable)
-- =================================================================

ALTER TABLE public.ranking_results
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'shortlisted', 'rejected'));

ALTER TABLE public.ranking_results
  ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

-- Recruiters filter their candidate pipeline by status
CREATE INDEX IF NOT EXISTS idx_ranking_results_status
  ON public.ranking_results (status);

-- Allow recruiters to update status/notes on results they own
-- (existing 0004 policies only covered SELECT and INSERT)
DROP POLICY IF EXISTS "ranking_results: recruiter can update via session" ON public.ranking_results;
CREATE POLICY "ranking_results: recruiter can update via session"
  ON public.ranking_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ranking_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ranking_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );


-- =================================================================
-- E. RLS on jobs
--
-- Enable RLS first (deny-all default for non-service roles).
--
-- Ownership check pattern (from 0003):
--   public.users.id is a custom UUID with no relation to auth.uid().
--   We resolve the caller's public.users.id by joining on email
--   from the JWT claim, exactly as 0003 does for the users table.
--
-- Policies:
--   authenticated SELECT  — recruiter reads their own jobs
--   authenticated INSERT  — recruiter inserts with their own id
--   authenticated UPDATE  — recruiter updates their own jobs
--   authenticated DELETE  — recruiter deletes their own jobs
--   service_role ALL      — supabaseAdmin bypass (/api/recruiter/*)
-- =================================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Helper subquery used in all authenticated policies:
--   (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email'))

DROP POLICY IF EXISTS "jobs: recruiter can select own" ON public.jobs;
CREATE POLICY "jobs: recruiter can select own"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    recruiter_id = (
      SELECT id FROM public.users
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "jobs: recruiter can insert own" ON public.jobs;
CREATE POLICY "jobs: recruiter can insert own"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    recruiter_id = (
      SELECT id FROM public.users
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "jobs: recruiter can update own" ON public.jobs;
CREATE POLICY "jobs: recruiter can update own"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    recruiter_id = (
      SELECT id FROM public.users
      WHERE email = (auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    recruiter_id = (
      SELECT id FROM public.users
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "jobs: recruiter can delete own" ON public.jobs;
CREATE POLICY "jobs: recruiter can delete own"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (
    recruiter_id = (
      SELECT id FROM public.users
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "jobs: service role full access" ON public.jobs;
CREATE POLICY "jobs: service role full access"
  ON public.jobs
  FOR ALL
  TO service_role
  USING      (true)
  WITH CHECK (true);


-- =================================================================
-- F. updated_at trigger on jobs
--
-- Automatically stamps updated_at on every UPDATE so application
-- code never needs to set it manually.
-- =================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_set_updated_at ON public.jobs;
CREATE TRIGGER jobs_set_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
