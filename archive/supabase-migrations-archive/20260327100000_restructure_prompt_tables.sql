-- Migration: restructure prompt_group and prompt tables
-- Date: 2026-03-27
--
-- prompt_group: keep id, name, created_at, updated_at — drop step
-- prompt:       add description (from prompt_1), keep group FK (NOT NULL),
--               drop prompt_1, prompt_2, prompt_3
--               NOTE: type column is kept as an internal system field for AI step routing
-- Data:         consolidate all prompt_group rows into one "SandBox Planner" row,
--               link all prompt rows to it

-- ── 1. Add description column to prompt ──────────────────────────────────────
ALTER TABLE public.prompt ADD COLUMN IF NOT EXISTS description TEXT;

-- Copy existing prompt_1 content into description
UPDATE public.prompt SET description = prompt_1 WHERE prompt_1 IS NOT NULL AND description IS NULL;

-- ── 2. Consolidate prompt_group: keep smallest id, rename to "SandBox Planner" ─
-- First, update that row's name
UPDATE public.prompt_group
  SET name = 'SandBox Planner'
  WHERE id = (SELECT MIN(id) FROM public.prompt_group);

-- Point all prompt rows (including our seeded ones with group=NULL) to the kept group
UPDATE public.prompt
  SET "group" = (SELECT MIN(id) FROM public.prompt_group);

-- Delete all other prompt_group rows (safe now since all prompts point to the kept row)
DELETE FROM public.prompt_group
  WHERE id <> (SELECT MIN(id) FROM public.prompt_group);

-- ── 3. Make prompt.group NOT NULL (all rows now linked) ─────────────────────
ALTER TABLE public.prompt ALTER COLUMN "group" SET NOT NULL;

-- Add FK constraint if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.prompt'::regclass
      AND conname = 'prompt_group_fkey'
  ) THEN
    ALTER TABLE public.prompt
      ADD CONSTRAINT prompt_group_fkey
        FOREIGN KEY ("group") REFERENCES public.prompt_group(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ── 4. Drop step column from prompt_group ───────────────────────────────────
ALTER TABLE public.prompt_group DROP COLUMN IF EXISTS step;

-- ── 5. Drop old redundant columns from prompt ───────────────────────────────
ALTER TABLE public.prompt DROP COLUMN IF EXISTS prompt_1;
ALTER TABLE public.prompt DROP COLUMN IF EXISTS prompt_2;
ALTER TABLE public.prompt DROP COLUMN IF EXISTS prompt_3;
-- NOTE: type column is intentionally kept — used internally by AI generation
--       functions in sandbox-planner/actions.ts to route prompts per step.
--       It is NOT exposed in the /prompts UI.
