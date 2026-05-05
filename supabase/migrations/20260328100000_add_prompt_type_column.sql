-- Migration: add type column to prompt for AI step routing
-- 2026-03-28
-- The type column maps each prompt to the sandbox-planner step that uses it.
-- Used by getPromptTemplate(step) in sandbox-planner/actions.ts.

ALTER TABLE public.prompt ADD COLUMN IF NOT EXISTS type TEXT;

-- Set type values for the 4 existing prompts (matched by name)
UPDATE public.prompt SET type = 'structure_align'
  WHERE name = 'Structure & Align Prompt';

UPDATE public.prompt SET type = 'refining_icp'
  WHERE name = 'Refining ICP Prompt';

UPDATE public.prompt SET type = 'product_definition_flows'
  WHERE name = 'Product Definition & Flows Prompt';

UPDATE public.prompt SET type = 'strategic_frameworks'
  WHERE name = 'Strategic Frameworks Prompt';
