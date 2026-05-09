-- Add is_admin flag to public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Grant admin to the founder
UPDATE public.users
  SET is_admin = true
  WHERE email = 'pavankumarreddy.poli@gmail.com';

-- Discount codes table
-- NOTE: created_by references auth.users(id) — API stores auth.uid(), not public.users.id
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT         NOT NULL UNIQUE,
  discount_percent INTEGER     NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  description     TEXT,
  max_uses        INTEGER,
  times_used      INTEGER      NOT NULL DEFAULT 0,
  active          BOOLEAN      NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_by      UUID         REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code_active
  ON public.discount_codes (code) WHERE active = true;

-- Usage tracking for analytics
CREATE TABLE IF NOT EXISTS public.discount_code_usages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID        NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  used_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_code_usages_user
  ON public.discount_code_usages (user_id, used_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_usages ENABLE ROW LEVEL SECURITY;

-- CRITICAL: public.users.id != auth.uid(). Use email-based JWT claim to check is_admin.
-- auth.jwt() ->> 'email' matches the authenticated user's email in public.users.
CREATE POLICY "admin_full_access_discount_codes"
  ON public.discount_codes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE email = (auth.jwt() ->> 'email') AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE email = (auth.jwt() ->> 'email') AND is_admin = true
  ));

-- Any authenticated user can read active codes (needed for billing page validation UI)
CREATE POLICY "users_read_active_codes"
  ON public.discount_codes FOR SELECT TO authenticated
  USING (active = true);

-- Service role bypasses RLS for API-level validation and admin operations
CREATE POLICY "service_role_full_access_discount_codes"
  ON public.discount_codes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_usages"
  ON public.discount_code_usages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Users can read their own usage history
CREATE POLICY "users_read_own_usages"
  ON public.discount_code_usages FOR SELECT TO authenticated
  USING (user_id = auth.uid());
