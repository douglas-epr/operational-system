-- user_ai_settings.use_agency_settings toggle (2026-04-29)
--
-- New per-user toggle that decides which API key the LLM resolver picks:
--   TRUE  → use the agency keys (default for new staff/client/qa users).
--   FALSE → use this user's personal keys (existing pre-toggle behavior).
--
-- Special-cased in the resolver: `referrer` and `lead` profiles ALWAYS use
-- their personal keys regardless of this column, because the agency
-- shouldn't be paying for LLM calls made by external referrers/leads. The
-- migration also forces the column to FALSE for those rows so the UI and
-- the resolver agree on the answer client-side and server-side.

ALTER TABLE public.user_ai_settings
  ADD COLUMN IF NOT EXISTS use_agency_settings BOOLEAN NOT NULL DEFAULT TRUE;

-- Existing users with a personal active_service set should keep their
-- current behaviour (their own keys, not the agency's).
UPDATE public.user_ai_settings
   SET use_agency_settings = FALSE
 WHERE active_service IS NOT NULL;

-- referrer / lead never use the agency fallback. Force the column FALSE so
-- a manual UI toggle can't accidentally enable it.
UPDATE public.user_ai_settings s
   SET use_agency_settings = FALSE
  FROM public.profiles p
 WHERE p.id = s.user_id
   AND p.type IN ('referrer'::public.os_user_type, 'lead'::public.os_user_type);
