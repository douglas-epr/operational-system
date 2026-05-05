-- ================================================================
-- Migration: 20260501000003_idea_styles_rls.sql
--
-- Replaces the overly-permissive "FOR ALL USING (true)" policy on
-- idea_styles with the same three-tier model used by all other idea
-- sub-tables (idea_icp, idea_block_product_definition_and_flows, etc.)
--
-- Access model:
--   • Admin / Manager  → full access
--   • Idea creator     → full access (via idea.created_by)
--   • Project member   → read-only  (via idea → project.authorized_users)
-- ================================================================

DROP POLICY IF EXISTS "idea_styles_all" ON public.idea_styles;

-- Admin / manager: full access
DROP POLICY IF EXISTS "idea_styles: admin/manager all" ON public.idea_styles;
CREATE POLICY "idea_styles: admin/manager all"
  ON public.idea_styles FOR ALL
  USING (public.is_admin_or_manager());

-- Idea creator: full access
DROP POLICY IF EXISTS "idea_styles: creator all" ON public.idea_styles;
CREATE POLICY "idea_styles: creator all"
  ON public.idea_styles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_id
        AND i.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_id
        AND i.created_by = auth.uid()
    )
  );

-- Project members: read-only
DROP POLICY IF EXISTS "idea_styles: project authorized user read" ON public.idea_styles;
CREATE POLICY "idea_styles: project authorized user read"
  ON public.idea_styles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

NOTIFY pgrst, 'reload schema';
