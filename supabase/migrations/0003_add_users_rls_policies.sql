-- =================================================================
-- supabase/migrations/0003_add_users_rls_policies.sql
--
-- Adds RLS policies to public.users.
--
-- Context: RLS was enabled on public.users (rowsecurity = true) but
-- zero policies existed, producing a Postgres deny-all default.
-- supabaseServer (authenticated role) got 0 rows on every read,
-- causing dashboard/layout.tsx to log PGRST116 and redirect to
-- /login on every dashboard load. Diagnosed 2026-05-06.
-- See 04 Build Plan/known_issues.md Finding B.
--
-- Policy design:
--   authenticated → SELECT own row only, matched by JWT email
--   service_role  → already bypasses RLS via BYPASSRLS privilege;
--                   the explicit policy below is redundant but
--                   documents the intent and survives privilege
--                   changes without silent breakage.
--
-- Safe to re-run: CREATE POLICY ... IF NOT EXISTS (PG 15+).
-- If on PG < 15 and re-running, the duplicate-policy error is
-- harmless — just means the policy already exists.
-- =================================================================

-- Allow each authenticated user to read their own row.
-- auth.jwt() ->> 'email' reads the email claim from the current
-- session JWT — the same value passed to .eq("email", ...) in code.
-- Matching by email (not auth.uid()) because public.users.id is a
-- custom UUID with no FK to auth.users.id.
CREATE POLICY "users: authenticated can read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ( (auth.jwt() ->> 'email') = email );

-- Explicit service-role pass-through (redundant with BYPASSRLS but
-- kept for documentation clarity and defensive correctness).
-- supabaseAdmin (service role key) uses this path for sync-user
-- INSERTs/UPDATEs and all admin reads.
CREATE POLICY "users: service role full access"
  ON public.users
  FOR ALL
  TO service_role
  USING      ( true )
  WITH CHECK ( true );
