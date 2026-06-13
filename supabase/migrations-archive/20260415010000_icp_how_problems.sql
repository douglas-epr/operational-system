-- Migration: Add "how this ICP solves problems" fields to idea_icp
-- Date: 2026-04-15
-- Purpose: Support the two new Refining ICP sections — today's workarounds
-- and the landscape of ways the problems could be solved (not just via our product).

ALTER TABLE public.idea_icp
  ADD COLUMN IF NOT EXISTS how_problems_are_solved   TEXT,
  ADD COLUMN IF NOT EXISTS how_problems_could_be_solved TEXT;
