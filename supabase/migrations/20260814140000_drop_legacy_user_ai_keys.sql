-- 2026-08-14 — Drop legacy per-user AI provider keys
--
-- Follow-up to 20260814120000_openrouter_platform_ai.sql. All generation now
-- runs on the platform OpenRouter key, so these columns have had no reader
-- since that migration. Dropping them also removes the last plaintext
-- third-party API keys from the database.
--
-- Destroys, irreversibly: 1 OpenAI key, 2 Gemini keys, 0 Claude keys across
-- 2 rows. Those keys should be rotated at their providers as well — dropping
-- the column does not revoke them.

ALTER TABLE public.user_ai_settings
  DROP COLUMN IF EXISTS active_service,
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS gemini_api_key,
  DROP COLUMN IF EXISTS claude_api_key,
  DROP COLUMN IF EXISTS openai_model,
  DROP COLUMN IF EXISTS gemini_model,
  DROP COLUMN IF EXISTS claude_model,
  DROP COLUMN IF EXISTS use_agency_settings;

-- Verified via pg_attribute that user_ai_settings.active_service was the only
-- column of this type (agency_ai_settings was dropped 2026-06-14), so the enum
-- has no remaining referents.
DROP TYPE IF EXISTS public.os_ai_service;

-- RLS: the existing "user_ai_settings: own row" policy (owner_id = auth.uid())
-- is unaffected — it keys on owner_id, which remains.

NOTIFY pgrst, 'reload schema';
