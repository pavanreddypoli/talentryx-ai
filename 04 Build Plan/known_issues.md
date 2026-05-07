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

**Additional note on Issue 1 below:** `user_type` lives on `profiles`, not `users`. The fix for Issue 1 must change both the table being queried and the column name, not just the column name.

---

## Issue 1 — `user_type` vs `active_role` mismatch (silent routing bug)

`/api/me` does `.from("users").select("user_type")`, but `user_type` does not exist on `public.users` — it is a column on `public.profiles`. The `users` table stores role state in `active_role`. Because PostgREST returns an error when the column is missing, and the route's error handler conflates that error with "user not found", any real logged-in user will receive `{"error":"User not found"}` from `/api/me` and be silently routed to the recruiter dashboard. The `RoleRedirectGuard` catches this client-side for job seekers, but there is still a flash of the wrong dashboard.

**Updated understanding (2026-05-06):** The original analysis said `user_type` was an unset column on `users`. Schema verification confirmed it does not exist on `users` at all — it is on `profiles`. The fix must change both the table queried and the field returned, not just the field name.

**Affected files:**
- [app/api/me/route.ts](../app/api/me/route.ts) — queries wrong table (`users`) for wrong column (`user_type`)
- [app/api/sync-user/route.ts](../app/api/sync-user/route.ts) — writes `active_role` to `users`
- [app/after-login/AfterLoginClient.tsx](../app/after-login/AfterLoginClient.tsx) — routes based on `/api/me` response
- [app/dashboard/RoleRedirectGuard.tsx](../app/dashboard/RoleRedirectGuard.tsx) — client-side fallback

**Recommended fix:** Rewrite `/api/me/route.ts` to query `public.users` for `active_role` (not `user_type`) and return it as `active_role`. Update `AfterLoginClient` to read `data.active_role` instead of `data.user_type`.

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
