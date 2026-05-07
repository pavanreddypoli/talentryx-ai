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

2. **`dashboard/layout.tsx` logs `PGRST116` (0 rows) on every dashboard load.** The layout queries `public.users` via `supabaseServer` (anon key) to read `active_role`. When the anon-key client returns 0 rows, it redirects to `/login`. This may be caused by RLS blocking the anon/authenticated role from reading `public.users` rows, or by a mismatch between the Supabase Auth session email and the email stored in `public.users`. Needs investigation before the dashboard is usable end-to-end.

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
