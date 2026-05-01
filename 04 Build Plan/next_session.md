# Next Session — Resume After Supabase Restore

Last updated: 2026-05-01
Paused reason: Supabase project is paused (unrelated to code); database unavailable until restored.

---

## Where We Are in Phase 0

Phase 0 is "foundation" work: confirming the real database schema, writing the verified migration file, and fixing the three known bugs before any feature development begins.

**Completed this session:**
- Full static analysis of all Supabase calls across `app/api/`, `lib/`, and `app/`
- Identified all six tables (`users`, `organizations`, `organization_members`, `profiles`, `ranking_sessions`, `ranking_results`) and the `resumes` Storage bucket
- Drafted `supabase/migrations/0001_initial_schema.sql` (UNVERIFIED — see header)
- Documented three blocking bugs in `known_issues.md`
- Prepared the exact SQL verification queries to run once the DB is restored

**Not yet done (blocked on DB restore):**
- Schema verification: real column names, types, constraints, and RLS policies have not been confirmed against production
- The migration file has not been reconciled or applied
- The three bugs in `known_issues.md` have not been fixed

---

## What Is Blocked on the Supabase Restore

Everything below requires read access to the live (or restored) database:

1. Running the schema verification queries to confirm or correct every `-- inferred` column in `0001_initial_schema.sql`
2. Confirming whether `user_type` exists as a real column in production `users`
3. Confirming whether `ranking_sessions.user_id` exists (it's inferred — critical for RLS)
4. Confirming whether `profiles` exists at all, or whether Stripe billing was wired differently

---

## First Three Tasks When We Return

### Task 1 — Download the Supabase backup and restore the project

1. Go to Supabase Dashboard → your project → Settings → Backups
2. Download the most recent backup (`.sql` or `.dump`)
3. Restore via `supabase db restore <backup-file>` or re-activate the paused project
4. Confirm connectivity: run `supabase status` or a simple `SELECT NOW()` in the SQL editor

### Task 2 — Run schema verification queries and reconcile the migration

1. Open Supabase Dashboard → SQL Editor
2. Run each query block from the session chat (columns, constraints, foreign keys, indexes, RLS, storage buckets)
3. Open `supabase/migrations/0001_initial_schema.sql` and go through every `-- inferred` comment
4. Correct column names, types, nullability, and defaults to match production reality
5. Remove the UNVERIFIED warning block once every line has been confirmed
6. The reconciled file becomes the source-of-truth migration

### Task 3 — Fix the three bugs from `known_issues.md` (Phase 0, Tasks 2–6)

Work through the issues in dependency order:

1. **Bug 1 (user_type / active_role):** one-line fix in `app/api/me/route.ts` — change `select("user_type")` to `select("active_role")`. Verify after-login routing sends job seekers to the correct dashboard.

2. **Bug 2 (history not persisting):** add Supabase inserts at the end of `app/api/rank/route.ts` — one insert into `ranking_sessions`, one per candidate into `ranking_results`. Verify the history page shows past runs.

3. **Bug 3 (dual identity):** add `auth_user_id` column to `public.users`, wire it in `sync-user`, then update `create-checkout-session` and `stripe-webhook` to join across the two tables where needed.

After these three fixes, Phase 0 is complete and Phase 1 feature work can begin.
