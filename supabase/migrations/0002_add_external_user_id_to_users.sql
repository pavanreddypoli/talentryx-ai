-- =================================================================
-- supabase/migrations/0002_add_external_user_id_to_users.sql
--
-- Adds the external_user_id column to public.users.
--
-- Context: this column was added to the application code (sync-user)
-- after the December production DB was created. The restored DB
-- predated the change, causing PGRST204 errors on every new user
-- creation. Discovered and fixed 2026-05-06.
--
-- Safe to re-run: both statements use IF NOT EXISTS / IF NOT EXISTS.
-- Partial unique index excludes NULL rows so existing users (who
-- have no external_user_id) do not conflict with each other.
-- =================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS external_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_external_user_id_key
  ON public.users (external_user_id)
  WHERE external_user_id IS NOT NULL;
