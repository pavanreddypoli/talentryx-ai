-- =================================================================
-- 0013 — Expand ranking_results.status to 8-stage pipeline
--
-- Current constraint allows: 'pending', 'shortlisted', 'rejected'
-- New constraint adds:       'phone_screen', 'interviewing',
--                            'offer_extended', 'hired', 'withdrew'
--
-- No data migration needed — all existing rows use values that
-- remain valid under the new constraint.
-- =================================================================

ALTER TABLE public.ranking_results
  DROP CONSTRAINT IF EXISTS ranking_results_status_check;

ALTER TABLE public.ranking_results
  ADD CONSTRAINT ranking_results_status_check
    CHECK (status IN (
      'pending',
      'shortlisted',
      'phone_screen',
      'interviewing',
      'offer_extended',
      'hired',
      'rejected',
      'withdrew'
    ));
