-- Add theme preference to profiles (light | dark only — no system)
CREATE TYPE public.os_theme_choice AS ENUM ('light', 'dark');
ALTER TABLE public.profiles
  ADD COLUMN theme public.os_theme_choice NOT NULL DEFAULT 'dark';

-- Add created_by to sop so non-admin users can manage their own SOPs
ALTER TABLE public.sop
  ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- RLS: admin/manager already have full access via existing policies.
-- Allow the creator to manage their own SOP (insert/update/delete/select).
CREATE POLICY "sop: creator manage own"
  ON public.sop
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Also add created_by to sop_version so the same access can cascade.
-- For now just expose it as a nullable column — the app sets it on insert.
ALTER TABLE public.sop_version
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
