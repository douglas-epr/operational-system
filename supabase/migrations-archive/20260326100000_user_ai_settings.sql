-- ================================================================
-- Migration: 20260326100000_user_ai_settings.sql
--
-- Adds per-user AI service configuration.
-- Uses existing os_ai_service enum: 'openai' | 'gemini' | 'claude'
-- One row per user (user_id is PK).
-- ================================================================

CREATE TABLE public.user_ai_settings (
  user_id        UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  active_service public.os_ai_service,
  openai_api_key TEXT,
  gemini_api_key TEXT,
  claude_api_key TEXT,
  openai_model   TEXT DEFAULT 'gpt-4.1',
  gemini_model   TEXT DEFAULT 'gemini-2.5-flash',
  claude_model   TEXT DEFAULT 'claude-sonnet-4-20250514',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: users can only access their own row
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_settings: own row"
  ON public.user_ai_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create the set_updated_at function if it doesn't exist yet
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
