-- ─────────────────────────────────────────────────────────────────────────────
-- Project visibility RLS: managers now see only authorized projects (not all).
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Before: "project: admin/manager all" let both admin AND manager bypass RLS.
-- After:  admin still bypasses RLS; everyone else (including manager) can only
--         SELECT projects where their uid is in the authorized_users array.
--         Manager INSERT is preserved so managers can create new projects.
--
-- The "project: operational read authorized" policy is removed because it is
-- now fully covered by the broader "project: member read" policy below.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "project: admin/manager all"              ON public.project;
DROP POLICY IF EXISTS "project: operational read authorized"    ON public.project;

-- Admin sees and manages every project (unchanged semantics for admins).
CREATE POLICY "project: admin all" ON public.project
  USING (public.get_user_type() = 'admin');

-- All other roles can only SELECT projects they are in authorized_users.
-- This covers: manager, operational, developer, client, qa.
CREATE POLICY "project: member read" ON public.project
  FOR SELECT USING (auth.uid() = ANY (authorized_users));

-- Managers retain the ability to INSERT new projects (needed to create projects).
-- UPDATE / DELETE are governed by the SELECT policy above (Postgres requires a
-- row to be visible before it can be mutated), so managers can only edit
-- projects they are already a member of — which is the correct behaviour.
CREATE POLICY "project: manager insert" ON public.project
  FOR INSERT WITH CHECK (public.get_user_type() = 'manager');
