-- ================================================================
-- Migration: 20260326000000_idea_access_via_project.sql
--
-- Redesigns idea access control:
--   BEFORE: each idea table has its own authorized_users UUID[] column
--   AFTER:  access is derived from idea.project.authorized_users
--
-- Access model:
--   • Admin / Manager → full access to all idea data (unchanged)
--   • idea.created_by = current user → full access (owner)
--   • current user IN idea.project.authorized_users → read-only
-- ================================================================

-- ── 1. Drop old GIN index on idea.authorized_users ──────────────
DROP INDEX IF EXISTS public.idea_authorized_users_idx;
-- The initial migration created an unnamed index; drop by expression if needed.
-- PostgREST will rebuild schema cache automatically.

-- ── 2. Drop old "authorized user read" RLS policies ─────────────
DROP POLICY IF EXISTS "idea: authorized user read"
  ON public.idea;
DROP POLICY IF EXISTS "idea_icp: authorized user read"
  ON public.idea_icp;
DROP POLICY IF EXISTS "idea_user_type: authorized user read"
  ON public.idea_user_type;
DROP POLICY IF EXISTS "idea_optimization_suggestion: authorized user read"
  ON public.idea_optimization_suggestion;
DROP POLICY IF EXISTS "idea_block_pdef: authorized user read"
  ON public.idea_block_product_definition_and_flows;
DROP POLICY IF EXISTS "idea_block_structure: authorized user read"
  ON public.idea_block_structure_and_align;

-- ── 3. Drop authorized_users columns from all idea tables ────────
ALTER TABLE public.idea
  DROP COLUMN IF EXISTS authorized_users;

ALTER TABLE public.idea_icp
  DROP COLUMN IF EXISTS authorized_users;

ALTER TABLE public.idea_user_type
  DROP COLUMN IF EXISTS authorized_users;

ALTER TABLE public.idea_optimization_suggestion
  DROP COLUMN IF EXISTS authorized_users;

ALTER TABLE public.idea_block_product_definition_and_flows
  DROP COLUMN IF EXISTS authorized_users;

ALTER TABLE public.idea_block_structure_and_align
  DROP COLUMN IF EXISTS authorized_users;

-- ── 4. New RLS policies ──────────────────────────────────────────
-- Access rule: user is in the authorized_users of the project linked to the idea.
-- Drop-if-exists before create to make migration idempotent.

-- ── idea ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "idea: project authorized user read" ON public.idea;
CREATE POLICY "idea: project authorized user read"
  ON public.idea FOR SELECT
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = idea.project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── idea_icp ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "idea_icp: creator all" ON public.idea_icp;
CREATE POLICY "idea_icp: creator all"
  ON public.idea_icp FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_icp.idea_id
        AND i.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_icp.idea_id
        AND i.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "idea_icp: project authorized user read" ON public.idea_icp;
CREATE POLICY "idea_icp: project authorized user read"
  ON public.idea_icp FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_icp.idea_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── idea_user_type ───────────────────────────────────────────────
DROP POLICY IF EXISTS "idea_user_type: creator all" ON public.idea_user_type;
CREATE POLICY "idea_user_type: creator all"
  ON public.idea_user_type FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_user_type.idea_id
        AND i.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_user_type.idea_id
        AND i.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "idea_user_type: project authorized user read" ON public.idea_user_type;
CREATE POLICY "idea_user_type: project authorized user read"
  ON public.idea_user_type FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_user_type.idea_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── idea_optimization_suggestion ─────────────────────────────────
DROP POLICY IF EXISTS "idea_optimization_suggestion: creator all" ON public.idea_optimization_suggestion;
CREATE POLICY "idea_optimization_suggestion: creator all"
  ON public.idea_optimization_suggestion FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_optimization_suggestion.idea_id
        AND i.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_optimization_suggestion.idea_id
        AND i.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "idea_optimization_suggestion: project authorized user read" ON public.idea_optimization_suggestion;
CREATE POLICY "idea_optimization_suggestion: project authorized user read"
  ON public.idea_optimization_suggestion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_optimization_suggestion.idea_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── idea_block_product_definition_and_flows ──────────────────────
-- Drop old owner policy (used authorized_users logic) and recreate.
DROP POLICY IF EXISTS "idea_block_pdef: owner all"
  ON public.idea_block_product_definition_and_flows;

DROP POLICY IF EXISTS "idea_block_pdef: creator all" ON public.idea_block_product_definition_and_flows;
CREATE POLICY "idea_block_pdef: creator all"
  ON public.idea_block_product_definition_and_flows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_block_product_definition_and_flows.idea_id
        AND i.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_block_product_definition_and_flows.idea_id
        AND i.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "idea_block_pdef: project authorized user read" ON public.idea_block_product_definition_and_flows;
CREATE POLICY "idea_block_pdef: project authorized user read"
  ON public.idea_block_product_definition_and_flows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_block_product_definition_and_flows.idea_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── idea_block_structure_and_align ───────────────────────────────
DROP POLICY IF EXISTS "idea_block_structure: creator all" ON public.idea_block_structure_and_align;
CREATE POLICY "idea_block_structure: creator all"
  ON public.idea_block_structure_and_align FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_block_structure_and_align.idea_id
        AND i.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea i
      WHERE i.id = idea_block_structure_and_align.idea_id
        AND i.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "idea_block_structure: project authorized user read" ON public.idea_block_structure_and_align;
CREATE POLICY "idea_block_structure: project authorized user read"
  ON public.idea_block_structure_and_align FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_block_structure_and_align.idea_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── 5. Refresh PostgREST schema cache ────────────────────────────
NOTIFY pgrst, 'reload schema';
