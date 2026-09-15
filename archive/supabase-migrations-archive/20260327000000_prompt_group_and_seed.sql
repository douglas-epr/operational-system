-- Migration: prompt_group extend + prompt extend + seed data
-- Date: 2026-03-27
-- NOTE: prompt_group table already exists with (id bigint, name, created_at).
-- We add missing columns and seed rows idempotently.

-- 1. Add missing columns to prompt_group
ALTER TABLE public.prompt_group
  ADD COLUMN IF NOT EXISTS step       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add unique constraint on step if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.prompt_group'::regclass
      AND conname = 'prompt_group_step_key'
  ) THEN
    ALTER TABLE public.prompt_group ADD CONSTRAINT prompt_group_step_key UNIQUE (step);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.prompt_group ENABLE ROW LEVEL SECURITY;

-- RLS policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prompt_group' AND policyname = 'prompt_group: admin/manager all'
  ) THEN
    CREATE POLICY "prompt_group: admin/manager all"
      ON public.prompt_group FOR ALL USING (public.is_admin_or_manager());
  END IF;
END $$;

-- updated_at trigger for prompt_group
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at' AND tgrelid = 'public.prompt_group'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.prompt_group
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 2. Extend prompt table
ALTER TABLE public.prompt
  ADD COLUMN IF NOT EXISTS prompt_1   TEXT,
  ADD COLUMN IF NOT EXISTS prompt_2   TEXT,
  ADD COLUMN IF NOT EXISTS prompt_3   TEXT,
  ADD COLUMN IF NOT EXISTS name       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- Make "group" nullable (it may exist as NOT NULL from prior schema drift)
ALTER TABLE public.prompt ALTER COLUMN "group" DROP NOT NULL;

-- updated_at trigger for prompt
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_prompt' AND tgrelid = 'public.prompt'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_prompt
      BEFORE UPDATE ON public.prompt
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 3. Seed prompt_group rows (conditional inserts — no ON CONFLICT needed)
INSERT INTO public.prompt_group (name, step)
SELECT 'Structure & Align', 'structure_align'
WHERE NOT EXISTS (SELECT 1 FROM public.prompt_group WHERE step = 'structure_align');

INSERT INTO public.prompt_group (name, step)
SELECT 'Refining ICP', 'refining_icp'
WHERE NOT EXISTS (SELECT 1 FROM public.prompt_group WHERE step = 'refining_icp');

INSERT INTO public.prompt_group (name, step)
SELECT 'Product Definition & Flows', 'product_definition_flows'
WHERE NOT EXISTS (SELECT 1 FROM public.prompt_group WHERE step = 'product_definition_flows');

INSERT INTO public.prompt_group (name, step)
SELECT 'Strategic Frameworks', 'strategic_frameworks'
WHERE NOT EXISTS (SELECT 1 FROM public.prompt_group WHERE step = 'strategic_frameworks');

-- 4. Seed prompt rows (conditional inserts)
INSERT INTO public.prompt (type, name, prompt_1)
SELECT
  'structure_align',
  'Structure & Align Prompt',
  $$You are a business analyst. Given the following startup idea, extract and return a JSON object with exactly these keys:
- "The Core Problem": A detailed description of the core problem this idea solves.
- "Target Audience": A detailed description of the primary target audience.
- "Primary Success Metrics": Specific, quantifiable success metrics.

Idea Name: {{idea_name}}
Idea Description: {{idea_description}}

Return ONLY valid JSON.$$
WHERE NOT EXISTS (SELECT 1 FROM public.prompt WHERE type = 'structure_align');

INSERT INTO public.prompt (type, name, prompt_1)
SELECT
  'refining_icp',
  'Refining ICP Prompt',
  $$You are an expert in Ideal Customer Profile analysis. Given the following business idea and its structure, generate 3-5 distinct ICPs.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with key "ICPs" containing an array of objects, each with:
- "name": ICP persona name
- "description": Brief description of this persona
- "operational_environment": Day in the life context and environment
- "strategic_pain_points_and_acute_needs": Key pain points and urgent needs

Return ONLY valid JSON.$$
WHERE NOT EXISTS (SELECT 1 FROM public.prompt WHERE type = 'refining_icp');

INSERT INTO public.prompt (type, name, prompt_1)
SELECT
  'product_definition_flows',
  'Product Definition & Flows Prompt',
  $$You are a product strategist. Given the following startup idea, define the product.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
ICPs: {{icp_names}}

Return a JSON object with:
- "Product Overview": Rich HTML text describing the product vision and architecture
- "Feature List & Logic": Rich HTML text with features organized by categories
- "User Flows": Array of objects with "user_name" (string), "description" (string), "user_flow" (string with HTML flow description)

Return ONLY valid JSON.$$
WHERE NOT EXISTS (SELECT 1 FROM public.prompt WHERE type = 'product_definition_flows');

INSERT INTO public.prompt (type, name, prompt_1)
SELECT
  'strategic_frameworks',
  'Strategic Frameworks Prompt',
  $$You are a strategic business consultant. Generate comprehensive strategic frameworks for each ICP.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

ICPs:
{{icp_descriptions}}

For EACH ICP, return a JSON object with key "ICPs" containing an array of objects with:
- "id": The ICP identifier (use their name as id)
- "name": ICP name
- "value_proposition_icp_pains": Value proposition addressing ICP pains
- "value_proposition_icp_gains": Value proposition gains for this ICP
- "value_proposition_value_map_solutions": Solutions mapped to this ICP
- "value_proposition_value_map_gain_creators": Gain creators for this ICP
- "jtbd": Jobs To Be Done synthesis text
- "architect_title": ICP archetype title
- "architect_subtitle": ICP archetype subtitle
- "architect_tags": Array of descriptor tags
- "architect_psychographics": Psychographic description
- "architect_firmographics": Firmographic description
- "pitch_need": NABC pitch — Need
- "pitch_approach": NABC pitch — Approach
- "pitch_benefit": NABC pitch — Benefit
- "pitch_competition": NABC pitch — Competition

Also include an "optimization_suggestions" array with objects: "name", "description".

Return ONLY valid JSON.$$
WHERE NOT EXISTS (SELECT 1 FROM public.prompt WHERE type = 'strategic_frameworks');
