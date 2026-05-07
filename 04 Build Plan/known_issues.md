# Known Issues — Surfaced During Phase 0 Schema Inference

Discovered: 2026-05-01 via static analysis of app/api/, lib/, and app/.

---

## ✅ Resolved — 2026-05-06

### R1 — `external_user_id` column missing from `users` table

**Found:** First `npm run dev` run against the restored DB returned `PGRST204 — Could not find the 'external_user_id' column of 'users' in the schema cache` on every `POST /api/sync-user` call, blocking all new user creation and first-time login.

**Root cause:** The `external_user_id` column was added to the application code (`sync-user` INSERT) after the December production database was created. The restored DB predated the change and the column was never applied via a migration.

**Fix applied:** `supabase/migrations/0002_add_external_user_id_to_users.sql` — `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS external_user_id TEXT` plus a partial unique index excluding NULLs. Applied directly via psql 2026-05-06. Verified: `POST /api/sync-user` returns 200 after the migration.

**Schema discoveries made while applying this fix** (compare against `0001_initial_schema.sql` which was reverse-engineered before DB access):

| Table | Column | Inferred | Reality |
|---|---|---|---|
| `users` | `clerk_user_id` | not inferred | **exists** — original Clerk ID column; never written by current code |
| `users` | `stripe_customer_id` | on `profiles` only | **also on `users`** — duplicated across both tables |
| `users` | `user_type` | inferred (nullable) | **does not exist on `users`** — it is on `profiles` instead |
| `users` | `email`, `full_name` | NOT NULL | nullable in production |
| `users` | `roles`, `active_role` | NOT NULL with defaults | nullable in production |
| `users` | `updated_at` | inferred | does not exist |
| `users` | UUID default | `uuid_generate_v4()` | `gen_random_uuid()` |
| `profiles` | `email`, `full_name` | not inferred | exist on `profiles` |
| `profiles` | `user_type` | not inferred | **exists on `profiles`** (see Issue 1 update below) |
| `profiles` | `created_at` type | `timestamptz` | `timestamp without time zone` |
| `ranking_results` | `matched_keywords` | not inferred | `TEXT[]` — exists in DB, never written by `/api/rank` |
| `ranking_results` | `missing_keywords` | not inferred | `TEXT[]` — exists in DB, never written by `/api/rank` |
| `ranking_results` | `summary` | not inferred | `TEXT[]` — exists in DB, never written by `/api/rank` |
| `ranking_results` | `full_text` | not inferred | `TEXT` — exists in DB, never written by `/api/rank` |
| `ranking_results` | `keyword_match_percent` | `INTEGER` | `NUMERIC` |

**Additional note:** `user_type` lives on `profiles`, not `users`. Fix applied — see R2 below.

---

### R2 — `user_type` / `active_role` mismatch in `/api/me` (Issue 1 resolved)

**Found:** `/api/me` queried `user_type` from `public.users`, but that column does not exist on `users` — it lives on `profiles`. The route's error handler masked the PostgREST PGRST204 column-not-found error as a 404 "User not found", so every `/api/me` call failed silently and all role-based routing defaulted to recruiter.

**Fix applied (2026-05-06, commit 3c66ffc):**
- [app/api/me/route.ts](../app/api/me/route.ts) — changed `.select("user_type")` → `.select("active_role")`; response field renamed from `user_type` to `active_role`
- [app/after-login/AfterLoginClient.tsx](../app/after-login/AfterLoginClient.tsx) — reads `data.active_role`
- [app/dashboard/RoleRedirectGuard.tsx](../app/dashboard/RoleRedirectGuard.tsx) — reads `data.active_role`
- [app/dashboard/layoutClient.tsx](../app/dashboard/layoutClient.tsx) — reads `data.active_role`

**Verified:** `GET /api/me` with `x-user-email` header returns `{"active_role":"recruiter"}` for a recruiter row and `{"active_role":"job_seeker"}` for a job_seeker row against the restored DB.

**Two follow-on findings surfaced during verification** (not blocking, documented here for the next session):

1. **`/api/me` email header never sent by client-side callers.** `AfterLoginClient`, `RoleRedirectGuard`, and `layoutClient` all call `fetch("/api/me")` with no `x-user-email` header, so they always receive 401. The after-login routing is currently handled entirely by the server-side guard in `app/dashboard/layout.tsx` (which reads `active_role` directly from Supabase). The client-side guards are effectively dead code. This is not a regression from this fix — it was always broken. Fix: either pass `x-user-email` from the client after getting the user via `supabase.auth.getUser()`, or switch `/api/me` to use the session cookie instead of the email header.

2. **`dashboard/layout.tsx` logs `PGRST116` (0 rows) on every dashboard load — Finding B, fully diagnosed 2026-05-06.** See full analysis below.

---

## ✅ Resolved — 2026-05-06

## Finding B — Dashboard always redirects to /login (RLS deny-all on public.users)

**Fix applied:** `supabase/migrations/0003_add_users_rls_policies.sql` — added `SELECT` policy for `authenticated` role using `(auth.jwt() ->> 'email') = email`, plus a `service_role` full-access policy. Applied via psql; both policies confirmed in `pg_policies`. Dev server restart confirmed zero `PGRST116 / Failed to load user role` errors.

### Diagnosis (2026-05-06)

**File:** [app/dashboard/layout.tsx](../app/dashboard/layout.tsx)

**What the code does:**
```
supabase = createSupabaseServerClient()       // anon key + session cookie
authData = supabase.auth.getUser()            // reads session → gets email
supabase.from("users")
  .select("active_role")
  .eq("email", authData.user.email)           // filter: match by email
  .single()                                   // PGRST116 if 0 rows → redirect("/login")
```

The client used is `supabaseServer` (anon key), which runs as the `authenticated` role in Postgres when a valid session cookie is present.

**Root cause confirmed: RLS enabled, zero policies.**

```
public.users  →  rowsecurity = true,  policies = 0
```

When RLS is enabled on a table with no policies, Postgres applies a **deny-all default** to every non-superuser role. The `authenticated` role (used by `supabaseServer`) cannot read any row — not because the email doesn't match, but because every row is silently filtered out before the WHERE clause even runs. `supabaseServer` returns 0 rows → PGRST116 → `redirect("/login")`.

**Email mismatch ruled out.** The email in the authenticated session (`pavankumarreddy.poli@gmail.com`) matches `public.users.email` exactly, same case, no whitespace difference.

**Identity comparison:**

| | `public.users` | `auth.users` |
|---|---|---|
| `id` | `bbf6ef63-f910-41a4-800b-b4b0a27a72b2` | `e44fa35d-4395-49e6-8146-1dcecbbaccf8` |
| `email` | `pavankumarreddy.poli@gmail.com` | `pavankumarreddy.poli@gmail.com` ✓ |
| external ID | `clerk_user_id = dev_user_1` / `external_user_id = NULL` | — |

The UUIDs are **completely different** — confirming Issue 3 (no FK link). However, since the layout filters by `email` not by `id`, the mismatch in IDs is not what causes the PGRST116. RLS is the sole cause.

**Additional finding: auth.users has 6 rows, public.users has 1.**

```
auth.users (6 rows):
  pavankumarreddy.poli@gmail.com    ← has public.users row
  pamidisushma02@gmail.com          ← no public.users row
  cheppanupobro@gamail.com          ← no public.users row (typo: gamail)
  cheppanupobro@gmail.com           ← no public.users row
  pavsnkumarreddy.poli@gmail.com    ← no public.users row (typo in name)
  ayaanreddypoli@gmail.com          ← no public.users row
```

Five of the six Supabase Auth users have never been synced to `public.users` via `sync-user`. Even after the RLS fix, these users will get PGRST116 because there is no matching row. This is the Issue 3 / dual-identity problem manifesting in practice.

---

### Proposed fixes — choose one

#### Option B-i — Add an RLS policy (preserves architecture)

One SQL statement, no code change:

```sql
-- supabase/migrations/0003_users_rls_authenticated_select.sql
CREATE POLICY "users: authenticated can read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (email = auth.email());
```

`auth.email()` is a Supabase built-in that returns the email from the current JWT — same value the code passes to `.eq("email", ...)`. The policy lets each authenticated user read exactly their own row and nothing else.

**Pros:**
- Correct Supabase architecture: RLS is the intended control layer for anon/authenticated reads
- No code changes — layout.tsx stays as-is
- Principle of least privilege: authenticated users read only their own row
- Extensible: other policies (INSERT, UPDATE) can be added independently

**Cons:**
- Requires a DB migration to apply
- Does not help the 5 auth users who have no `public.users` row — they still get PGRST116 after this fix (separate problem: Issue 3 / missing sync-user rows)
- `auth.email()` is an email-string match, which is correct here but would break if an email changed (not a current concern)

---

#### Option B-ii — Switch the lookup to supabaseAdmin (changes architecture)

Two-line code change in [app/dashboard/layout.tsx](../app/dashboard/layout.tsx):

```typescript
// Keep supabaseServer for auth.getUser() — it needs the session cookie
const supabase = await createSupabaseServerClient();
const { data: authData } = await supabase.auth.getUser();
if (!authData.user) redirect("/login");

// Switch to service role for the public.users lookup — bypasses RLS
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const { data: userRecord, error } = await supabaseAdmin
  .from("users")
  .select("active_role")
  .eq("email", authData.user.email)
  .single();
```

The service role key bypasses RLS entirely, so the query always reaches the row.

**Pros:**
- No DB migration needed — immediate fix
- Works regardless of future RLS policy state
- Also bypasses the 0-row problem for the 5 unsynced auth users — would return a meaningful "not found" error rather than an RLS-silenced one (though still 404/redirect)

**Cons:**
- Architecturally inconsistent: uses service role in a Server Component where the authenticated client is the correct tool
- The service role key is already server-side-only (safe), but bypassing RLS means a bug in the email parameter (e.g., an injection or logic error) could expose another user's row instead of being silently blocked
- Sets a precedent of using service role for reads that should be user-scoped
- Still does not fix the 5 unsynced auth users — they get a code-level 404 redirect instead of an RLS-silenced one, but the result (login redirect) is the same

---

### Recommendation

**Option B-i** is the correct fix. The deny-all state is a missing migration, not an intentional architecture choice. A one-line RLS policy is the right instrument — it's what RLS is for. Option B-ii papers over a DB configuration gap with a service-role workaround that will make the 5-unsynced-users problem harder to diagnose later (the RLS silence is replaced with an application error, but the root cause stays invisible).

The 5 unsynced auth users are a separate problem (Issue 3 downstream effect) and should be handled separately — either by a backfill migration or by ensuring `sync-user` runs on every Supabase Auth sign-in via a database trigger or webhook.

---

## Issue 4 — Orphaned `auth.users` rows with no `public.users` counterpart

**Discovered:** 2026-05-06 during diagnosis of Finding B (RLS deny-all).

**Symptom:** Even after the RLS policy is in place, 5 of the 6 Supabase Auth users will still receive `PGRST116` on dashboard load because there is no matching row in `public.users`. The RLS policy allows the query to reach the table; the 0-row result comes from the missing row, not from RLS.

**Affected accounts:**

| Email | `auth.users` row | `public.users` row |
|---|---|---|
| `pavankumarreddy.poli@gmail.com` | ✓ | ✓ (the only synced user) |
| `pamidisushma02@gmail.com` | ✓ | ✗ |
| `cheppanupobro@gamail.com` | ✓ | ✗ (typo: gamail) |
| `cheppanupobro@gmail.com` | ✓ | ✗ |
| `pavsnkumarreddy.poli@gmail.com` | ✓ | ✗ (typo in name) |
| `ayaanreddypoli@gmail.com` | ✓ | ✗ |

**Root cause:** `public.users` is populated only via `POST /api/sync-user`, which is called from `AfterLoginClient` on the `/after-login` page. Users who were created in Supabase Auth but never completed the `/after-login` flow (or who signed up during an earlier Clerk-based auth period) never had a `sync-user` call made on their behalf.

**Why this is separate from Finding B:** Finding B (resolved) was a blanket deny-all caused by zero RLS policies. Issue 4 is a data gap — the authenticated session is valid, the policy permits the read, but the row does not exist. These are independent problems; B-i fixed B, not 4.

**Recommended fix (two-part):**
1. **Backfill:** For each affected email, insert a row into `public.users` with a default `active_role` (`recruiter` or `job_seeker` as appropriate), plus a corresponding `organizations` + `organization_members` row to satisfy any NOT NULL FK constraints. Use `supabaseAdmin` in a one-time migration or Supabase dashboard SQL.
2. **Prevention:** Add a Supabase Auth webhook or database trigger on `auth.users` INSERT that calls `sync-user` (or directly inserts into `public.users`) so future sign-ups are always synced regardless of whether they hit the `/after-login` page.

**Note:** The two typo accounts (`gamail.com`, `pavsnkumarreddy`) are probably test/accident accounts and may be safe to leave unsynced or delete from `auth.users` directly.

---

## Issue 2 — `/api/rank` never persists to `ranking_sessions` (history always empty)

The history pages at `/dashboard/history` and `/dashboard/history/[sessionId]` read from `ranking_sessions` and `ranking_results`, but the ranking route `/api/rank` performs all scoring in memory and returns results directly to the client without writing to either table. Every user's history will be empty regardless of how many ranking runs they perform.

**Affected files:**
- [app/api/rank/route.ts](../app/api/rank/route.ts) — does not insert into Supabase
- [app/dashboard/history/page.tsx](../app/dashboard/history/page.tsx) — reads `ranking_sessions`
- [app/dashboard/history/[sessionId]/page.tsx](../app/dashboard/history/%5BsessionId%5D/page.tsx) — reads `ranking_sessions` and `ranking_results`

**Recommended fix:** At the end of the `/api/rank` POST handler, after computing results, insert one row into `ranking_sessions` (using `supabaseAdmin` or the authenticated server client) and one row per candidate into `ranking_results`, then return the existing results payload unchanged.

---

## Issue 3 — Dual identity tables (`public.users` vs `profiles`) are never linked

The codebase maintains two separate user-identity tables: `public.users` stores Clerk-synced users with a custom UUID and role data; `public.profiles` stores Supabase Auth native users (`profiles.id = auth.users.id`) with Stripe billing data. These tables are never joined. As a result, billing state (`is_pro`, `stripe_customer_id`) and role/plan state (`plan`, `active_role`) live in completely separate rows with no shared key. Any feature that needs to check both (e.g. "is this pro user a recruiter?") cannot do so with a single query.

**Affected files:**
- [app/api/sync-user/route.ts](../app/api/sync-user/route.ts) — creates/updates `public.users`
- [app/api/create-checkout-session/route.ts](../app/api/create-checkout-session/route.ts) — reads/writes `profiles`
- [app/api/stripe-webhook/route.ts](../app/api/stripe-webhook/route.ts) — updates `profiles.is_pro`
- [lib/supabaseAdmin.ts](../lib/supabaseAdmin.ts), [lib/supabaseServer.ts](../lib/supabaseServer.ts)

**Recommended fix:** Add an `auth_user_id UUID REFERENCES auth.users(id)` column to `public.users`, populate it during the Supabase Auth sign-up callback, and use it to join the two tables when billing + role state are both needed.
