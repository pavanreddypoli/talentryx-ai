# Known Issues — Surfaced During Phase 0 Schema Inference

Discovered: 2026-05-01 via static analysis of app/api/, lib/, and app/.
Status: unresolved — database is paused, fixes pending restore.

---

## Issue 1 — `user_type` vs `active_role` mismatch (silent routing bug)

`/api/me` reads the column `user_type` from `public.users`, but `/api/sync-user` never writes `user_type` — it writes `active_role`. Because `user_type` is always NULL, `/api/me` always returns `"recruiter"` (via the null-coalescing default `user.user_type ?? "recruiter"`). This means job seekers are silently routed to the recruiter dashboard after login; the `RoleRedirectGuard` in the dashboard layout then catches it client-side, but there is a window where the wrong dashboard renders.

**Affected files:**
- [app/api/me/route.ts](../app/api/me/route.ts) — reads `user_type`
- [app/api/sync-user/route.ts](../app/api/sync-user/route.ts) — writes `active_role`, never `user_type`
- [app/after-login/AfterLoginClient.tsx](../app/after-login/AfterLoginClient.tsx) — routes based on `/api/me` response
- [app/dashboard/RoleRedirectGuard.tsx](../app/dashboard/RoleRedirectGuard.tsx) — client-side fallback

**Recommended fix:** In `/api/me/route.ts`, change `.select("user_type")` to `.select("active_role")` and return `active_role` instead of `user_type`.

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
