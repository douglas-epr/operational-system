-- Add stage enum and column to idea table
DO $$ BEGIN
  CREATE TYPE public.os_idea_stage AS ENUM (
    'refining_idea',
    'validating_market_and_building_product'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.idea
  ADD COLUMN IF NOT EXISTS stage public.os_idea_stage NOT NULL DEFAULT 'refining_idea';
