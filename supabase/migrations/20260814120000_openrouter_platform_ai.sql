-- 2026-08-14 — Platform-wide OpenRouter AI
--
-- All AI generation now routes through a single platform-owned OpenRouter key
-- (OPENROUTER_API_KEY). Users no longer supply their own provider keys, so the
-- only per-user preference left is which OpenRouter model to run on.
--
-- The legacy columns (active_service, *_api_key, *_model, use_agency_settings)
-- are intentionally left in place here: no application code reads them any more,
-- but dropping them destroys the stored keys irreversibly. A follow-up migration
-- should drop them — and public.os_ai_service with them — once confirmed.

ALTER TABLE public.user_ai_settings
  ADD COLUMN IF NOT EXISTS openrouter_model text NOT NULL DEFAULT 'openai/gpt-4.1';

COMMENT ON COLUMN public.user_ai_settings.openrouter_model IS
  'OpenRouter model slug used for this user''s generations. The API key is platform-owned.';

-- RLS: the existing "user_ai_settings: own row" policy (owner_id = auth.uid())
-- already covers this table for all operations, including the new column.
