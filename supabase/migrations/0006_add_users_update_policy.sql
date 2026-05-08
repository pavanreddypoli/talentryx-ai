-- =================================================================
-- supabase/migrations/0006_add_users_update_policy.sql
--
-- Adds UPDATE RLS policy to public.users for the authenticated role.
--
-- Context: 0003 added only a SELECT policy. With no UPDATE policy,
-- Postgres deny-all silently dropped all UPDATE calls from
-- supabaseServer (authenticated role) — PostgREST returned 200 with
-- 0 rows affected, masking the failure.
-- Diagnosed 2026-05-08 during E1a Settings page build.
-- See 04 Build Plan/known_issues.md (root cause documented).
--
-- Policy design:
--   authenticated → UPDATE own row only, matched by JWT email.
--   USING enforces which rows are visible to update (old row check).
--   WITH CHECK enforces the new row state (prevents changing email
--   to another user's value).
--   service_role  → explicit UPDATE pass-through, consistent with
--                   the FOR ALL policy added in 0003.
-- =================================================================

CREATE POLICY "users: authenticated can update own row"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING      ( (auth.jwt() ->> 'email') = email )
  WITH CHECK ( (auth.jwt() ->> 'email') = email );

CREATE POLICY "users: service role can update any row"
  ON public.users
  FOR UPDATE
  TO service_role
  USING      ( true )
  WITH CHECK ( true );
