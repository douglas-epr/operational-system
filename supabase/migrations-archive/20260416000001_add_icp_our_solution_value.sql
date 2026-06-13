-- Add our_solution_value column to idea_icp
-- Stores AI-generated or manually entered description of the value our product
-- brings specifically to this ICP, tied to their pain points.
ALTER TABLE idea_icp ADD COLUMN IF NOT EXISTS our_solution_value text;
