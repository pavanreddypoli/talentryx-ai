-- ─────────────────────────────────────────────────────────────────────────────
-- 0011: auto-create public.users row when an auth user is confirmed
--       + backfill existing confirmed orphans (Issue 4)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Trigger function: upsert a public.users row from auth.users metadata.
--    SECURITY DEFINER lets it write to public.users from the auth schema context.
--    ON CONFLICT (email) DO NOTHING makes it idempotent — safe for existing users.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (email, full_name, active_role, roles, plan)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'intended_role', 'recruiter'),
    ARRAY[COALESCE(NEW.raw_user_meta_data->>'intended_role', 'recruiter')],
    'free'
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Fires on INSERT when email confirmation is disabled (session created immediately).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Fires when user clicks the confirmation email link (NULL → non-NULL transition).
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Backfill: create public.users rows for any confirmed auth users that have none.
--    Uses the same defaults as the trigger. Only affects confirmed orphans.
INSERT INTO public.users (email, full_name, active_role, roles, plan)
SELECT
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) AS full_name,
  COALESCE(u.raw_user_meta_data->>'intended_role', 'recruiter')              AS active_role,
  ARRAY[COALESCE(u.raw_user_meta_data->>'intended_role', 'recruiter')]       AS roles,
  'free'                                                                      AS plan
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
  AND u.email NOT IN (SELECT email FROM public.users WHERE email IS NOT NULL)
ON CONFLICT (email) DO NOTHING;
