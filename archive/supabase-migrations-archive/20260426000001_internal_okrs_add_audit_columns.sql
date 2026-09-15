-- Follow-up to 20260426000000_internal_okrs.sql: earlier migration used
-- CREATE TABLE IF NOT EXISTS, which skipped column additions on pre-
-- existing OKR tables (they already existed from a previous run with a
-- narrower schema). This migration adds the missing audit columns.

ALTER TABLE public.internal_goal
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.internal_key_result
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.internal_key_result_track
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
