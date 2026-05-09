-- Issue 10: Scope resumes bucket SELECT policy to the caller's own user-id folder.
-- Old policy name is misleading ("Allow users to read only their files") but actually
-- allowed ANY authenticated user to read ANY file. Drop and replace.
--
-- Storage paths follow pattern: <auth.uid()>/<timestamp>_<filename>
-- split_part(name, '/', 1) extracts the first path segment (the user_id folder).
--
-- All app storage ops use supabaseAdmin (service role) which bypasses RLS entirely,
-- so this change has zero impact on existing signed-URL generation or uploads.
-- It closes the direct-URL access gap where any authenticated user could read any file.

DROP POLICY IF EXISTS "Policy: Allow users to read only their files" ON storage.objects;

CREATE POLICY "resumes_owner_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
