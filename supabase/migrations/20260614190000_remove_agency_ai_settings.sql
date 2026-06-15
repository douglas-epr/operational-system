-- ============================================================
-- Migration: remove the agency-wide AI settings concept.
--   Each user now always uses their own AI service/keys/model.
--   The `agency` table (name/website) is intentionally KEPT — only the
--   AI half is removed.
-- Applied with: npx supabase migration up (NOT db reset)
-- ============================================================

-- 1. Drop the agency AI settings table (its RLS policies drop with it).
DROP TABLE IF EXISTS public.agency_ai_settings CASCADE;

-- 2. Drop the per-user "use agency keys" opt-in column.
ALTER TABLE public.user_ai_settings
  DROP COLUMN IF EXISTS use_agency_settings;
