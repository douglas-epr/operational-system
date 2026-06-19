-- Add debate columns to idea_risk_and_validation so the Devil's Advocate debate
-- runs in the Risk & Validation step (step 9) instead of in the Report step (step 10).
-- This removes the circular dependency: Risk & Validation no longer needs Report to exist first.
ALTER TABLE public.idea_risk_and_validation
  ADD COLUMN IF NOT EXISTS debate_transcript jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS debate_meta       jsonb,
  ADD COLUMN IF NOT EXISTS agreed_problem    text,
  ADD COLUMN IF NOT EXISTS agreed_solution   text;
