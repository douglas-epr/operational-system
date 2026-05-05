-- ================================================================
-- Migration: 20260501000001_profile_coworker_visibility.sql
--
-- Allows developers, QA, and clients to read the profile rows of
-- other users who share at least one project with them.
--
-- Access model (additive — existing policies remain):
--   • Users can already read their OWN profile (profiles: read own)
--   • Admin/manager can already read ALL profiles
--   • NEW: any user who is in project.authorized_users can read
--     the profiles of every other user in the same project's
--     authorized_users array.
--
-- Column restriction: RLS is row-level. Application code must NEVER
-- select profiles.signature when reading other users' profiles.
-- All existing cross-user queries already omit that column.
-- ================================================================

DROP POLICY IF EXISTS "profiles: project co-member read" ON public.profiles;

CREATE POLICY "profiles: project co-member read"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
      WHERE auth.uid() = ANY(p.authorized_users)
        AND profiles.id = ANY(p.authorized_users)
    )
  );

NOTIFY pgrst, 'reload schema';
