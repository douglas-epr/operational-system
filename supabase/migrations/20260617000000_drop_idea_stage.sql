-- Drop the stage column from ideas table (no longer used in UI or marketing filter).
-- All ideas now appear in /marketing regardless of stage.

ALTER TABLE idea DROP COLUMN IF EXISTS stage;
DROP TYPE IF EXISTS os_idea_stage;
