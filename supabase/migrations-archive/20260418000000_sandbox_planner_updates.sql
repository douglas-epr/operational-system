-- Sandbox Planner updates:
-- 1. Add score_rationale column to idea_icp (for Strategic Frameworks).
-- 2. Rename legacy "idea_block_*" tables to cleaner names.

-- Task 4: Strategic Frameworks — score rationale column
ALTER TABLE idea_icp ADD COLUMN IF NOT EXISTS score_rationale text;

-- Task 5: Rename legacy block tables (RLS policies survive a rename)
ALTER TABLE IF EXISTS public.idea_block_product_definition_and_flows
  RENAME TO idea_product_definition_and_flows;
ALTER TABLE IF EXISTS public.idea_block_structure_and_align
  RENAME TO idea_structure_and_align;

-- Keep policy names aligned with new table names
ALTER POLICY "idea_block_pdef: admin/manager all"
  ON public.idea_product_definition_and_flows
  RENAME TO "idea_pdef: admin/manager all";
ALTER POLICY "idea_block_pdef: creator all"
  ON public.idea_product_definition_and_flows
  RENAME TO "idea_pdef: creator all";
ALTER POLICY "idea_block_pdef: project authorized user read"
  ON public.idea_product_definition_and_flows
  RENAME TO "idea_pdef: project authorized user read";
ALTER POLICY "idea_block_structure: admin/manager all"
  ON public.idea_structure_and_align
  RENAME TO "idea_structure: admin/manager all";
ALTER POLICY "idea_block_structure: creator all"
  ON public.idea_structure_and_align
  RENAME TO "idea_structure: creator all";
ALTER POLICY "idea_block_structure: project authorized user read"
  ON public.idea_structure_and_align
  RENAME TO "idea_structure: project authorized user read";

NOTIFY pgrst, 'reload schema';
