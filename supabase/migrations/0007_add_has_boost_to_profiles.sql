-- =================================================================
-- supabase/migrations/0007_add_has_boost_to_profiles.sql
--
-- Adds has_boost column to public.profiles to support the
-- Talentryx Boost subscription tier for job seekers ($9/month).
--
-- Context: E1b added is_pro for the recruiter Pro tier. F1 adds
-- the job-seeker Boost tier. A single boolean is sufficient —
-- future multi-tier logic should migrate to a plan/tier enum column.
--
-- Partial index covers only boosted users (expected to be rare
-- relative to total profiles) — keeps index overhead near zero.
-- =================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_boost BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_has_boost
  ON public.profiles (has_boost)
  WHERE has_boost = true;
