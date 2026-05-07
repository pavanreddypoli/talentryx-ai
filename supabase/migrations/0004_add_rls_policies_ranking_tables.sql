-- =================================================================
-- supabase/migrations/0004_add_rls_policies_ranking_tables.sql
--
-- Adds RLS policies to public.ranking_sessions and
-- public.ranking_results.
--
-- Context: Both tables had rowsecurity = true but zero policies,
-- producing a Postgres deny-all default for all non-superuser roles.
-- The authenticated role (used by supabaseServer in /api/rank and
-- the history pages) could neither INSERT new sessions/results nor
-- SELECT them back. Diagnosed 2026-05-06.
--
-- Policy design:
--   ranking_sessions authenticated SELECT  → auth.uid() = user_id
--   ranking_sessions authenticated INSERT  → auth.uid() = user_id
--   ranking_results  authenticated SELECT  → session owned by user
--   ranking_results  authenticated INSERT  → session owned by user
--   service_role     → BYPASSRLS; explicit policies for documentation
--
-- Safe to re-run: DROP POLICY IF EXISTS before CREATE so this script
-- is idempotent on PG 15+ and on PG < 15.
-- =================================================================

-- ─── ranking_sessions ─────────────────────────────────────────────

DROP POLICY IF EXISTS "ranking_sessions: authenticated SELECT" ON public.ranking_sessions;
CREATE POLICY "ranking_sessions: authenticated SELECT"
  ON public.ranking_sessions
  FOR SELECT
  TO authenticated
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "ranking_sessions: authenticated INSERT" ON public.ranking_sessions;
CREATE POLICY "ranking_sessions: authenticated INSERT"
  ON public.ranking_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "ranking_sessions: service role full access" ON public.ranking_sessions;
CREATE POLICY "ranking_sessions: service role full access"
  ON public.ranking_sessions
  FOR ALL
  TO service_role
  USING      ( true )
  WITH CHECK ( true );

-- ─── ranking_results ──────────────────────────────────────────────
-- Access is granted via session ownership (no direct user_id on this
-- table). The sub-SELECT on ranking_sessions is safe: the session row
-- is committed before results are inserted, so the EXISTS check finds
-- it immediately.

DROP POLICY IF EXISTS "ranking_results: authenticated SELECT" ON public.ranking_results;
CREATE POLICY "ranking_results: authenticated SELECT"
  ON public.ranking_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ranking_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ranking_results: authenticated INSERT" ON public.ranking_results;
CREATE POLICY "ranking_results: authenticated INSERT"
  ON public.ranking_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ranking_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ranking_results: service role full access" ON public.ranking_results;
CREATE POLICY "ranking_results: service role full access"
  ON public.ranking_results
  FOR ALL
  TO service_role
  USING      ( true )
  WITH CHECK ( true );
