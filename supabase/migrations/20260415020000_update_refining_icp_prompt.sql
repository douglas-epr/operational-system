-- Migration: Update Refining ICP prompt to emit the two new fields
-- Date: 2026-04-15
-- Purpose: Teach the AI to also produce `how_problems_are_solved_currently`
-- and `how_problems_could_be_solved` for each ICP. The "could" field should
-- enumerate a broad solution landscape (tools, services, workflows, emerging
-- approaches, and where our product fits) — not pitch our product.
--
-- The Refining ICP prompt is keyed by its stable UUID (see PROMPT_ID_BY_STEP
-- in src/app/sandbox-planner/actions.ts). The prompt body lives in the
-- `description` column of `public.prompt`.

UPDATE public.prompt
SET
  description = $prompt$You are an expert in Ideal Customer Profile analysis. Given the following business idea and its structure, generate 3-5 distinct ICPs.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with key "ICPs" containing an array of objects, each with:
- "name": ICP persona name
- "description": Brief description of this persona
- "operational_environment": Day in the life context and environment (rich HTML allowed)
- "strategic_pain_points_and_acute_needs": Key pain points and urgent needs (rich HTML allowed)
- "how_problems_are_solved_currently": Rich HTML describing how this ICP solves the above problems today — the tools, services, workarounds, manual processes, and compromises they currently rely on. Be concrete and cite real products/categories where plausible.
- "how_problems_could_be_solved": Rich HTML enumerating ALL plausible ways these problems could be solved — a broad solution-landscape survey. Include existing tools/services, alternative workflows, emerging technologies/trends, DIY approaches, and finally note where our product could fit in. This is NOT a pitch for our product; it is a map of the possibility space.

Return ONLY valid JSON.$prompt$,
  updated_at = NOW()
WHERE id = 'f361a898-5858-4d24-b605-5e9b2554ac9d';
