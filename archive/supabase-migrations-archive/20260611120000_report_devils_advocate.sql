-- Migration: Devil's Advocate debate columns on idea_report + seeded prompt rows
-- Adds 8 new nullable columns to idea_report (all existing columns untouched).
-- Adds 4 new editable prompt rows (group 9 = SandBox Planner) for the debate personas.

ALTER TABLE public.idea_report
  ADD COLUMN IF NOT EXISTS agreed_problem       text,
  ADD COLUMN IF NOT EXISTS agreed_solution      text,
  ADD COLUMN IF NOT EXISTS recommendation       text,
  ADD COLUMN IF NOT EXISTS revised_description  text,
  ADD COLUMN IF NOT EXISTS completeness_score   numeric,
  ADD COLUMN IF NOT EXISTS alignment            jsonb,
  ADD COLUMN IF NOT EXISTS debate_transcript    jsonb,
  ADD COLUMN IF NOT EXISTS debate_meta          jsonb;

-- Seed 4 editable prompt rows (group 9 = SandBox Planner, same as all existing idea-refiner prompts).
-- DB rows win over code fallback constants; these can be edited at /prompts.

-- description is intentionally NULL so getPromptTemplate returns null and the
-- FALLBACK_* code constants are used. Set description via /prompts UI to override.
INSERT INTO public.prompt (id, "group", name, description, created_at, updated_at)
VALUES
  ('da000001-0000-4000-8000-000000000001', 9, 'Report Skeptic',   NULL, now(), now()),
  ('da000002-0000-4000-8000-000000000001', 9, 'Report Advocate',  NULL, now(), now()),
  ('da000003-0000-4000-8000-000000000001', 9, 'Report Reframer',  NULL, now(), now()),
  ('da000004-0000-4000-8000-000000000001', 9, 'Report Scorer',    NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
