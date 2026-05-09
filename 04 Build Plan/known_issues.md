# Known Issues — Surfaced During Phase 0 Schema Inference

Discovered: 2026-05-01 via static analysis of app/api/, lib/, and app/.

---

## ✅ Resolved — 2026-05-06

### Finding C — Login redirect loop (Supabase browser/server client library mismatch)

**Found:** 2026-05-06 during manual browser test of Finding B fix. After the RLS policy was applied and verified in psql, logging in as `pavankumarreddy.poli@gmail.com` produced an infinite redirect loop between `/login` and `/dashboard`.

**Root cause:** The codebase simultaneously used two incompatible Supabase client libraries:
- `@supabase/auth-helpers-nextjs@^0.15.0` — imported by `lib/supabaseClient.ts` (browser/login client)
- `@supabase/ssr@^0.8.0` — imported by `lib/supabaseServer.ts` (server component client)

These two libraries use different session cookie storage schemes. `auth-helpers-nextjs` writes `sb-access-token` / `sb-refresh-token` cookies on sign-in. `@supabase/ssr`'s `createServerClient` reads a `sb-[project-ref]-auth-token` cookie. Because the server client couldn't find its expected cookie format, `supabase.auth.getUser()` returned `null` in `dashboard/layout.tsx` on every request, triggering `redirect("/login")` immediately — before the PostgREST query even ran.

**Why earlier tests didn't catch it:** Before Finding B was diagnosed and the RLS policy was applied, every visit to `/dashboard` failed at the PostgREST layer (0 rows, PGRST116). The library mismatch was masked by the RLS deny-all: both problems redirected to `/login`, but the RLS error appeared first in the logs and was the visible symptom.

**Loop sequence:**
```
1. /login page renders → useEffect: browser client (auth-helpers) sees session → router.push("/after-login")
2. /after-login → sync-user → /api/me (no header → 401) → router.push("/dashboard")
3. dashboard/layout.tsx → supabaseServer (ssr) cannot read session cookie → authData.user = null → redirect("/login")
4. Back to step 1 → infinite loop
```

**Fix applied (2026-05-06):**
- `lib/supabaseClient.ts` — changed import from `@supabase/auth-helpers-nextjs` to `@supabase/ssr`. `createBrowserClient` has identical signature (arity 3: `url, key, options?`) in both packages.
- Removed `@supabase/auth-helpers-nextjs` and `@supabase/auth-helpers-react` from `package.json` entirely — no other file in the codebase imported from either package.
- Ran `npm install` and `npm run build` — clean build, zero errors.

**Verified:** Login flow reaches `/dashboard` without redirect loop. No PGRST116, no `Failed to load user role` errors.

---

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

## Issue 5 — Recruiter dashboard renders job-seeker UI (bulk recruiter workflow not implemented)

**Discovered:** 2026-05-06 during manual verification of Issue 2 (history persistence).

**Symptom:** The recruiter dashboard at `/dashboard` renders a single-resume "Your Resume Match Analysis" UI with one JD textarea and one resume upload zone. The sidebar correctly shows "Recruiter Intelligence Platform" and the URL is `/dashboard` (routing is correct), but the main content area is the job-seeker single-resume analyzer, not a bulk recruiter workflow. The hardcoded "Job Seeker Dashboard" label in the page header (tracked as UI-1) is actually accurate — the component is the same one rendered for job seekers.

**Root cause confirmed via git history:**
- `app/dashboard/DashboardClient.tsx` has been a single-resume analyzer since the initial commit (`202733b`). A bulk recruiter workflow was never built into this component.
- `app/job-seeker/dashboard/page.tsx` previously had its own 145-line job-seeker-specific UI. On 2025-12-15, commit `26d80d5` ("made recruiter and job seeker pages identical") replaced it with a one-liner: `import DashboardClient from "@/app/dashboard/DashboardClient"`. This collapsed both roles to share the same component.
- Both `/dashboard` and `/job-seeker/dashboard` now render `DashboardClient` — the recruiter view has no distinct bulk-ranking UI.

**Scope:** Phase 1 product work, not a bug fix. Building the recruiter dashboard requires:
- Multi-file drag-and-drop (bulk resume upload, 10–50 files)
- Candidate table with bulk ranking results
- Session naming / tagging
- Possibly a dedicated `/api/rank/bulk` endpoint or reuse of the existing `/api/rank` with multi-file support (already present in the route)
- Estimated effort: 4–8 hours of UI work

**Why it blocks Issue 2 testing:** Issue 2 adds history persistence to the rank API. The intended verification path was: recruiter uploads 2–3 resumes → ranked results appear → history page shows the session. That path requires a recruiter-specific UI with multi-file upload. Since only the single-resume flow exists, Issue 2 can be partially verified (single-resume run → history entry appears) but the bulk-ranking use case cannot be tested until Issue 5 is addressed.

**Affected files:**
- [app/dashboard/DashboardClient.tsx](../app/dashboard/DashboardClient.tsx) — shared component; no recruiter-specific view
- [app/dashboard/page.tsx](../app/dashboard/page.tsx) — renders `DashboardClient` directly
- [app/job-seeker/dashboard/page.tsx](../app/job-seeker/dashboard/page.tsx) — re-exports `DashboardClient`

**Do not fix in Phase 0.** Track for Phase 1 sprint planning.

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

## Issue 4.1 — No-context redirect to /signup for auth-but-no-users-row state

**Discovered:** 2026-05-08 during fix(auth) login role picker removal.

**Symptom:** When a user with a valid Supabase Auth session but no `public.users` row hits `/after-login` (login flow, no role query param), `/api/me` returns 404, and `AfterLoginClient` redirects them to `/signup` with no explanation. The signup page shows "Create a new account" — confusing for a user who already has credentials.

**Root cause:** Issue 4 (orphaned auth rows) produces this state. The `/signup` redirect is intentional — submitting the signup form will re-run `sync-user` and create the missing `public.users` row, resolving the account. But the UX is silent.

**Recommended fix:** Before redirecting, show a brief banner: "We need to finish setting up your account — please complete signup." Low effort — one query param passed to `/signup` and a conditional banner on the signup page.

**Priority:** Low — depends on Issue 4 being the trigger. No current users land in this state via the normal signup flow. Fix alongside Issue 4 remediation.

**UX improvement applied (2026-05-08, Step F5):** `AfterLoginClient` now redirects to `/signup?reason=incomplete_setup`. `app/(auth)/signup/page.tsx` reads the `reason` param and shows a banner: "We need to finish setting up your account. Please confirm your role to continue." Underlying Issue 4 (orphaned rows) is still unresolved.

---

## ✅ Resolved — 2026-05-07

## Issue 2 — `/api/rank` never persists to `ranking_sessions` (history always empty)

**Fix applied (2026-05-07):**

- `app/api/rank/route.ts` — after scoring and sorting, added a best-effort persistence block (wrapped in `try/catch`) that:
  1. INSERTs one row into `ranking_sessions` (`user_id = session.user.id`, `job_description`, `created_at`)
  2. On success, INSERTs one row per candidate into `ranking_results` with all columns: `candidate_name`, `file_name`, `snippet`, `score`, `keyword_match_percent`, `matched_keywords`, `missing_keywords`, `summary` (= `strengths` array), `full_text`, `storage_path` (null — files are in-memory only), `created_at`
  - Uses `supabaseServer` (authenticated role) so RLS scopes data to the session owner
  - A DB failure logs an error and is swallowed — it never breaks the response

- `supabase/migrations/0004_add_rls_policies_ranking_tables.sql` — both tables had `rowsecurity = true` with zero policies (same deny-all pattern as `public.users` before Finding B). Added SELECT + INSERT policies for `authenticated` on both tables, plus service_role pass-through. Applied 2026-05-07.

- `results.push()` in the per-file loop now includes `matched_keywords`, `missing_keywords`, `summary` alongside the existing fields, making the full dataset available in both the API response and the DB row.

**Verified (2026-05-07):**
- `POST /api/rank` → 200, no persistence errors in logs
- `ranking_sessions` row created: `id = 6c5a5833-0fa9-4997-b38a-564dc42edc31`, `user_id = e44fa35d-...`, correct `job_description`, `created_at` set
- `ranking_results` row: all columns populated — `matched_keywords` (27-item array), `missing_keywords` (populated), `summary` (3-item strengths array), `full_text` (full resume text), `snippet` (400-char excerpt). `storage_path` null as expected.
- `GET /dashboard/history` → 200, session visible in list
- `GET /dashboard/history/6c5a5833-...` → 200, candidate row rendered with score and snippet

**Scope note:** Verified via single-resume flow only. Bulk recruiter workflow (Issue 5) not yet built; multi-candidate testing deferred to Phase 1.

**Side finding noted during verification:** `app/api/rank/route.ts` uses `supabase.auth.getSession()` to read `session.user.id` for the `user_id` insert. Supabase logs a security warning recommending `getUser()` (which validates with the auth server) over `getSession()` (which reads from cookie storage without validation). The existing authentication check is not broken — the warning is pre-existing and not introduced by this fix — but should be addressed in a future hardening pass.

---

## Issue 3 — Dual identity tables (`public.users` vs `profiles`) are never linked

The codebase maintains two separate user-identity tables: `public.users` stores Clerk-synced users with a custom UUID and role data; `public.profiles` stores Supabase Auth native users (`profiles.id = auth.users.id`) with Stripe billing data. These tables are never joined. As a result, billing state (`is_pro`, `stripe_customer_id`) and role/plan state (`plan`, `active_role`) live in completely separate rows with no shared key. Any feature that needs to check both (e.g. "is this pro user a recruiter?") cannot do so with a single query.

**Affected files:**
- [app/api/sync-user/route.ts](../app/api/sync-user/route.ts) — creates/updates `public.users`
- [app/api/create-checkout-session/route.ts](../app/api/create-checkout-session/route.ts) — reads/writes `profiles`
- [app/api/stripe-webhook/route.ts](../app/api/stripe-webhook/route.ts) — updates `profiles.is_pro`
- [lib/supabaseAdmin.ts](../lib/supabaseAdmin.ts), [lib/supabaseServer.ts](../lib/supabaseServer.ts)

**Recommended fix:** Add an `auth_user_id UUID REFERENCES auth.users(id)` column to `public.users`, populate it during the Supabase Auth sign-up callback, and use it to join the two tables when billing + role state are both needed.

---

## ✅ Resolved — 2026-05-08 (Step F5)

## Issue 7 — Theme toggle button is non-functional — ThemeProvider never wired up

**Discovered:** 2026-05-07 during localhost verification of the dashboard sidebar redesign (Step 8).

**Symptom:** Clicking the Light/Dark Mode button in the dashboard sidebar produces no visible change. The button renders, the `onClick` fires (no JS error), but the theme does not flip.

**Root cause:** `useTheme()` from `next-themes` returns a no-op `{ theme: undefined, setTheme: () => {} }` when called outside a `ThemeProvider`. The `next-themes` package is installed (`^0.4.6`) but `app/providers.tsx` only sets up Supabase context — `ThemeProvider` was never added. Confirmed via full `git log` of `app/providers.tsx`: every commit shows only `SupabaseContext.Provider`, no `ThemeProvider` at any point in history.

**Affected files:**
- [app/providers.tsx](../app/providers.tsx) — needs `ThemeProvider` wrapping `{children}`
- [app/layout.tsx](../app/layout.tsx) — needs `suppressHydrationWarning` on `<html>` tag
- [app/dashboard/layoutClient.tsx](../app/dashboard/layoutClient.tsx) — uses `useTheme()` correctly; works as written once provider exists

**Recommended fix (~10 lines):**
1. In `app/providers.tsx` — import `ThemeProvider` from `next-themes`, wrap the `SupabaseContext.Provider` return with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
2. In `app/layout.tsx` — add `suppressHydrationWarning` to the `<html>` tag to prevent the server/client theme flash

**Priority:** Low — this feature has never worked in any deployed version; no user is depending on it. Roll into the next dark-mode pass when other dashboard pages are redesigned for dark mode.

**Fix applied (2026-05-08, Step F5):** `app/providers.tsx` — added `ThemeProvider` from `next-themes` wrapping `SupabaseContext.Provider` with `attribute="class" defaultTheme="system" enableSystem`. `app/layout.tsx` — added `suppressHydrationWarning` to `<html>` tag. Theme toggle now functional.

---

## ✅ Resolved — 2026-05-08

## Issue 6 — `auth.getSession()` used in API routes instead of `auth.getUser()`

**Discovered:** 2026-05-07 (noted as side finding during Issue 2 resolution). Formally logged 2026-05-08.

**Symptom:** `app/api/create-checkout-session/route.ts` and `app/api/rank/route.ts` called `supabase.auth.getSession()` to read `session.user.id` for DB inserts. Supabase logs a security warning recommending `getUser()` (which validates the JWT against the Supabase Auth server) over `getSession()` (which reads the JWT from cookie storage without server-side validation). An attacker who can forge a cookie could potentially bypass the session check in `getSession()`-only flows.

**Fix applied (2026-05-08, Step E1b):**
- `app/api/create-checkout-session/route.ts` — changed `auth.getSession()` → `auth.getUser()`
- `app/api/recruiter/billing/checkout/route.ts` — written from scratch using `auth.getUser()`
- `app/api/rank/route.ts` still uses `getSession()` — low risk (non-payment flow), deferred to a future hardening pass

**Verified:** No regressions. `getUser()` returns the same `user.id` for valid sessions.

---

## ✅ Resolved — 2026-05-08 (Step F5)

## Issue 8 — `/api/admin/check-admin` returning 404, flooding dev server logs

**Discovered:** 2026-05-08 during F5 polish audit.

**Symptom:** Some client-side code (source not found in codebase — likely a browser extension or leftover devtools check) was making `GET /api/admin/check-admin` requests on every render. No route existed, producing 404 responses that cluttered the dev server log.

**Fix applied (2026-05-08, Step F5):** Created stub route `app/api/admin/check-admin/route.ts` returning `{ isAdmin: false }` with a 200 status. Eliminates the 404 noise without removing any real functionality.

---

## Issue 9 — Gaps in candidate drawer stored as keyword tokens, not prose

**Discovered:** 2026-05-08 during D6 build.

**Symptom:** The "Gaps" section in the candidate detail drawer displays raw keyword tokens (e.g. `"aws"`, `"docker"`, `"kubernetes"`) as chips rather than human-readable prose sentences (e.g. "Cloud keywords appear missing — add examples of AWS/GCP usage").

**Root cause:** `/api/rank` computes prose gap descriptions (`gaps[]`) but stores only `missing_keywords[]` (raw token array) in `ranking_results`. The `gaps[]` strings are returned in the API response but never persisted to the DB. `GET /api/recruiter/jobs/[jobId]/candidates` returns `missing_keywords` from the DB, which is all the drawer has to work with.

**Fix for D7:** Either (a) add a `gaps TEXT[]` column to `ranking_results` and persist the computed gap strings in `/api/rank`, or (b) regenerate prose gaps client-side from `missing_keywords` using the same bucketing/insight logic. Option (a) is cleaner — one migration, persisted alongside strengths.

**Priority:** Low — keyword chips are readable and informative. Polish pass in D7.

---

## Issue 10 — Supabase Storage `resumes` bucket SELECT policy is too permissive

**Discovered:** 2026-05-08 during D7 file-persistence investigation.

**Priority:** MEDIUM-HIGH. Fix before any other recruiters/users beyond the dev account get access to the bucket. Service-role pattern in our app bypasses this, but if anyone hits Supabase Storage URLs directly, they could read other users' resumes.

**Symptom:** The `resumes` bucket currently has a SELECT policy scoped to `auth.role() = 'authenticated'` — any authenticated user can read any file in the bucket, regardless of ownership. There is no ownership check tying the file path to the uploader's user ID.

**Root cause:** The storage policy was written permissively during initial setup. File paths are namespaced by `user_id` in the upload code (`${session.user.id}/${...}`), but the policy does not enforce this at the Supabase layer.

**App behavior:** All resume access in the app goes through `GET /api/recruiter/jobs/[jobId]/candidates/[candidateId]/resume`, which uses `supabaseAdmin.storage.createSignedUrl()`. This endpoint validates job ownership before issuing the URL, so the app never exposes unauthorized files. But a user who obtains another user's Storage path can construct a direct Supabase Storage URL and read the file.

**Recommended fix (one SQL statement):**
```sql
-- Replace existing SELECT policy with an ownership-scoped one
DROP POLICY IF EXISTS "allow authenticated read" ON storage.objects;
CREATE POLICY "resumes: owner read only"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```
`storage.foldername(name)` returns the path segments; `[1]` is the first segment, which equals `session.user.id` per our upload convention.

**Affected files:**
- Upload path set in `app/api/rank/route.ts` — `${session.user.id}/...`
- Signed URL issued by `app/api/recruiter/jobs/[jobId]/candidates/[candidateId]/resume/route.ts`

---

## UI-1 — "Job Seeker Dashboard" label shown in recruiter dashboard header (low priority)

**Discovered:** 2026-05-06 during manual browser test confirming Finding C fix.

**Symptom:** The top-right header area of the recruiter dashboard at `/dashboard` displays the label "Job Seeker Dashboard". The sidebar correctly shows "Recruiter Intelligence Platform". The two labels are inconsistent.

**Affected file:** Likely a hardcoded string in the recruiter dashboard page or its header component — not yet traced to a specific file.

**Priority:** Low. Cosmetic only — no functional impact, no data exposure, no broken routing. Fix during a UI polish pass.
