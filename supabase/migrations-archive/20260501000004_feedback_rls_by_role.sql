-- ================================================================
-- Migration: 20260501000004_feedback_rls_by_role.sql
--
-- Restricts feedback visibility by user role.
--
-- BEFORE: "feedback: authed read" — any authenticated user could
--         read ALL feedback rows.
--
-- AFTER:
--   • admin, manager, operational → read all feedback
--   • all other types (developer, client, qa, referrer, lead)
--                                → read only their own feedback
--                                  (created_by = auth.uid())
-- ================================================================

DROP POLICY IF EXISTS "feedback: authed read"      ON public.feedback;
DROP POLICY IF EXISTS "feedback: role-based read"  ON public.feedback;

CREATE POLICY "feedback: role-based read"
  ON public.feedback FOR SELECT
  USING (
    public.get_user_type() IN ('admin', 'manager', 'operational')
    OR created_by = auth.uid()
  );

NOTIFY pgrst, 'reload schema';
