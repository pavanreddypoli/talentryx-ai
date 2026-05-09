-- Add jd_updated_at to track when the job description was last changed.
-- For existing rows, default to created_at (meaning "JD has not been changed
-- since the job was created") — prevents false-positive stale candidate banners.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS jd_updated_at TIMESTAMPTZ;

UPDATE public.jobs
  SET jd_updated_at = created_at
  WHERE jd_updated_at IS NULL;

ALTER TABLE public.jobs
  ALTER COLUMN jd_updated_at SET NOT NULL,
  ALTER COLUMN jd_updated_at SET DEFAULT NOW();
