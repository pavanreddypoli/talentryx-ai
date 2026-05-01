-- =================================================================
-- supabase/migrations/0001_initial_schema.sql
--
-- ██╗   ██╗███╗   ██╗██╗   ██╗███████╗██████╗ ██╗███████╗██╗███████╗██████╗
-- ██║   ██║████╗  ██║██║   ██║██╔════╝██╔══██╗██║██╔════╝██║██╔════╝██╔══██╗
-- ██║   ██║██╔██╗ ██║██║   ██║█████╗  ██████╔╝██║█████╗  ██║█████╗  ██║  ██║
-- ██║   ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██║██╔══╝  ██║██╔══╝  ██║  ██║
-- ╚██████╔╝██║ ╚████║ ╚████╔╝ ███████╗██║  ██║██║██║     ██║███████╗██████╔╝
--
-- STATUS: UNVERIFIED — DO NOT APPLY TO ANY DATABASE
-- =================================================================
--
-- This file was reverse-engineered by static analysis of the
-- codebase (app/api/, lib/, app/) on 2026-05-01. It has NOT been
-- reconciled against the actual production Supabase schema.
--
-- BEFORE APPLYING:
--   1. Run the verification queries in docs/schema_verification.sql
--      (or the commands listed in the session chat) against the
--      restored production database.
--   2. Diff the real column names, types, and constraints against
--      every column marked -- inferred below.
--   3. Resolve the three known inconsistencies documented in
--      04 Build Plan/known_issues.md before running any migration.
--   4. Only then remove this warning block and apply via:
--        supabase db push   (if using Supabase CLI migrations)
--      or paste into the Dashboard SQL editor.
--
-- Every column or constraint that was not directly observed in code
-- is marked with a trailing -- inferred comment.
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =================================================================
-- TABLE: users
-- Custom user table (NOT auth.users).
-- Synced from an external auth provider (likely Clerk) via
-- POST /api/sync-user.  All access uses supabaseAdmin (service role)
-- which bypasses RLS.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_user_id  TEXT        UNIQUE,
  email             TEXT        NOT NULL UNIQUE,
  full_name         TEXT        NOT NULL,
  plan              TEXT        NOT NULL DEFAULT 'free',              -- 'free' | 'pro' -- inferred enum
  roles             TEXT[]      NOT NULL DEFAULT ARRAY['recruiter'],  -- multi-role: 'recruiter' | 'job_seeker'
  active_role       TEXT        NOT NULL DEFAULT 'recruiter',         -- 'recruiter' | 'job_seeker'
  -- WARNING: /api/me reads `user_type` but /api/sync-user never writes it.
  -- This may be a legacy column predating `active_role`, or a rename that
  -- was never completed. See 04 Build Plan/known_issues.md issue #1.
  user_type         TEXT,                                             -- inferred — possibly legacy alias for active_role
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),               -- inferred
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()                -- inferred
);


-- =================================================================
-- TABLE: organizations
-- Auto-created one-per-user on first sync.
-- All access via supabaseAdmin (bypasses RLS).
-- =================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  owner_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()                      -- inferred
);


-- =================================================================
-- TABLE: organization_members
-- Junction table: users <-> organizations.
-- All access via supabaseAdmin (bypasses RLS).
-- =================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),  -- inferred
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL DEFAULT 'member',               -- 'owner' | 'member' | 'admin' -- inferred enum
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),                  -- inferred
  UNIQUE (organization_id, user_id)                                     -- inferred
);


-- =================================================================
-- TABLE: profiles
-- Tied to Supabase Auth (auth.users.id), NOT to public.users.id.
-- These are DIFFERENT identity stores:
--   profiles.id  = auth.users.id  (Supabase native auth)
--   users.id     = custom UUID    (Clerk-synced)
-- They are never joined in current code. See known_issues.md #3.
-- Accessed via supabaseServer (anon key) → RLS is enforced.
-- Stores Stripe billing state.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT        UNIQUE,                               -- inferred uniqueness constraint
  is_pro              BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()                -- inferred
);


-- =================================================================
-- TABLE: ranking_sessions
-- One row per resume-ranking run.
-- READ by /dashboard/history (supabaseServer, RLS-enforced).
-- WARNING: /api/rank does NOT currently INSERT here — the history
-- feature reads data that no route presently writes. This means
-- history is empty for all users. See known_issues.md #2.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.ranking_sessions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- inferred — required for RLS
  job_description  TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =================================================================
-- TABLE: ranking_results
-- One row per resume evaluated in a ranking session.
-- READ by /dashboard/history/[sessionId] (supabaseServer, RLS).
-- `storage_path` references a file in the `resumes` Storage bucket.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.ranking_results (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID        NOT NULL REFERENCES public.ranking_sessions(id) ON DELETE CASCADE,
  candidate_name        TEXT,
  file_name             TEXT,
  snippet               TEXT,                                           -- first ~400 chars of resume text -- inferred
  score                 NUMERIC(5,4),                                   -- 0.0000–1.0000 (e.g. 0.7500) -- inferred precision
  keyword_match_percent INTEGER,                                        -- 0–100
  storage_path          TEXT,                                           -- path within 'resumes' Storage bucket -- inferred (nullable)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()              -- inferred
);


-- =================================================================
-- INDEXES
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_external_user_id
  ON public.users(external_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
  ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id
  ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_ranking_sessions_user_id
  ON public.ranking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_results_session_id
  ON public.ranking_results(session_id);


-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================

-- profiles, ranking_sessions, ranking_results are accessed via
-- supabaseServer (anon key) — RLS is the only access control layer.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_results ENABLE ROW LEVEL SECURITY;

-- users/organizations/organization_members are accessed ONLY via
-- supabaseAdmin (service role) which bypasses RLS. Enable RLS
-- defensively so anon/authenticated roles can never reach these
-- tables directly from the client.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------
-- POLICIES: profiles
-- -----------------------------------------------------------------
-- TODO: verify — user reads and updates their own row only
CREATE POLICY "profiles: owner read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: owner update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- TODO: verify — stripe-webhook currently uses supabaseServer (anon
-- key) to update is_pro. Consider switching webhook to supabaseAdmin
-- to remove the need for this authenticated-update policy.
CREATE POLICY "profiles: authenticated update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "profiles: service role all" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------
-- POLICIES: ranking_sessions
-- -----------------------------------------------------------------
-- TODO: verify — user sees only sessions they created
CREATE POLICY "ranking_sessions: owner read" ON public.ranking_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ranking_sessions: owner insert" ON public.ranking_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ranking_sessions: service role all" ON public.ranking_sessions
  FOR ALL USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------
-- POLICIES: ranking_results
-- -----------------------------------------------------------------
-- TODO: verify — results are scoped through their parent session's
-- user_id so no direct user_id column is needed on this table
CREATE POLICY "ranking_results: owner read via session" ON public.ranking_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ranking_sessions s
      WHERE s.id = ranking_results.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "ranking_results: owner insert via session" ON public.ranking_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ranking_sessions s
      WHERE s.id = ranking_results.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "ranking_results: service role all" ON public.ranking_results
  FOR ALL USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------
-- POLICIES: users / organizations / organization_members
-- Only accessible via service role — block all other access
-- -----------------------------------------------------------------
-- TODO: verify — no anon or authenticated client access expected
CREATE POLICY "users: service role only" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "organizations: service role only" ON public.organizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "organization_members: service role only" ON public.organization_members
  FOR ALL USING (auth.role() = 'service_role');


-- =================================================================
-- STORAGE BUCKET
-- Cannot be created via SQL. Use Supabase CLI or Dashboard.
-- =================================================================
-- Bucket name : resumes
-- Access      : PRIVATE (not public)
-- Signed URLs : issued by POST /api/resume-download (10-min TTL)
--
-- Create via CLI:
--   supabase storage buckets create resumes
-- Or: Dashboard → Storage → New Bucket → uncheck Public
--
-- Recommended storage RLS policy:
--   Authenticated users can upload only to their own uid/ folder:
--     (storage.foldername(name))[1] = auth.uid()::text
-- =================================================================
