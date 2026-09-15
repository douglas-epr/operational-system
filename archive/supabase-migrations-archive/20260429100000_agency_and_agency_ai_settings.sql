-- Agency singleton + agency-wide AI settings (2026-04-29)
--
-- Two new tables:
--   public.agency               — one-row "this is the agency that runs the
--                                  studio" record. Only admins can edit;
--                                  everyone signed in can read so the UI can
--                                  show the agency name.
--   public.agency_ai_settings   — one-row-per-agency AI config (keys + models
--                                  + active service). Only admin/manager can
--                                  read or write client-side. The server-side
--                                  resolver (`resolveAiConfig`) reads via the
--                                  service-role client so non-admin LLM calls
--                                  still work without exposing the keys.

-- ── 1. Agency table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agency (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  website     TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at ON public.agency;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.agency
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency: any authed read" ON public.agency;
CREATE POLICY "agency: any authed read"
  ON public.agency FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "agency: admin write" ON public.agency;
CREATE POLICY "agency: admin write"
  ON public.agency FOR ALL
  USING (
    (SELECT type FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.os_user_type
  )
  WITH CHECK (
    (SELECT type FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.os_user_type
  );

-- ── 2. Agency AI settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agency_ai_settings (
  agency_id      UUID PRIMARY KEY REFERENCES public.agency(id) ON DELETE CASCADE,
  active_service public.os_ai_service,
  openai_api_key TEXT,
  openai_model   TEXT DEFAULT 'gpt-4.1',
  gemini_api_key TEXT,
  gemini_model   TEXT DEFAULT 'gemini-2.5-flash',
  claude_api_key TEXT,
  claude_model   TEXT DEFAULT 'claude-sonnet-4-20250514',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at ON public.agency_ai_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.agency_ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agency_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_ai_settings: admin/manager read" ON public.agency_ai_settings;
CREATE POLICY "agency_ai_settings: admin/manager read"
  ON public.agency_ai_settings FOR SELECT
  USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "agency_ai_settings: admin/manager write" ON public.agency_ai_settings;
CREATE POLICY "agency_ai_settings: admin/manager write"
  ON public.agency_ai_settings FOR ALL
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());
