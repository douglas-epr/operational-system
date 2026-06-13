-- Add current_ai_request_id column to idea for race-prevention on AI generation.
-- When triggerAiGeneration starts, it writes a fresh UUID. Before writing results,
-- helpers re-read this column and skip the write if the value no longer matches,
-- preventing a stale (slow) AI response from overwriting a fresh one made after
-- the user switched models or re-triggered the generation.
ALTER TABLE idea ADD COLUMN IF NOT EXISTS current_ai_request_id uuid;
