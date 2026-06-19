-- Add "Features per Page" section to the PRD step.
-- Explains how each app page works by combining Essential Features + Core Users
-- flow, page-by-page, to guide AI coding of the application.
ALTER TABLE public.idea_prd ADD COLUMN IF NOT EXISTS features_per_page text;
