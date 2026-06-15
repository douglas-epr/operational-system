-- ─────────────────────────────────────────────────────────────────────────────
-- Allow all authenticated users to see basic profile info.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Before: "profiles: project co-member read" restricted non-admin/non-manager
--         users to only seeing profiles of people who share a project with them.
--         This caused profile pictures to be invisible in the chat UI.
--
-- After:  Any authenticated user can read the basic profile fields (id, first_name,
--         last_name, picture, type) for all profiles. The existing admin/manager
--         and self-read policies remain in place.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "profiles: authenticated read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
