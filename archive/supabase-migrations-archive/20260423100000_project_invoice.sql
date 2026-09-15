-- Docs page: Invoices tab.
--
-- Creates the `project_invoice` table that backs the invoice-generator
-- feature under /docs?project=[id]&tab=invoices, plus RLS following the
-- same pattern as the other Docs tabs:
--   • admin/manager                → full access
--   • project.authorized_users     → SELECT + INSERT (where created_by = self)
--   • row owner (created_by=self)  → UPDATE + DELETE
--
-- Field list comes straight from the user spec; `authorized_users` is kept
-- as a per-row allow-list (nullable, currently not consulted by RLS — the
-- project's own authorized_users column drives access), leaving room for a
-- finer-grained future policy.

-- ────────────────────────────────────────────────────────────────
-- 1. Table
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_invoice (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID        NOT NULL REFERENCES public.project(id)  ON DELETE CASCADE,
  created_by             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  authorized_users       UUID[]      NOT NULL DEFAULT '{}',
  code                   TEXT        NOT NULL,
  company_or_user_name   TEXT,
  document_number        TEXT,
  address                TEXT,
  phone                  TEXT,
  email                  TEXT,
  client_name            TEXT,
  service_price          NUMERIC(14,2),
  due_date               DATE,
  service_title          TEXT,
  service_description    TEXT,
  swift_code             TEXT,
  iban_code              TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_invoice_project_id  ON public.project_invoice(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoice_created_by  ON public.project_invoice(created_by);


-- ────────────────────────────────────────────────────────────────
-- 2. RLS policies
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_invoice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_invoice: admin/manager all"        ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: authorized user read"     ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: authorized user insert"   ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: owner update"             ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: owner delete"             ON public.project_invoice;

CREATE POLICY "project_invoice: admin/manager all"
  ON public.project_invoice FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_invoice: authorized user read"
  ON public.project_invoice FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_invoice: authorized user insert"
  ON public.project_invoice FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_invoice: owner update"
  ON public.project_invoice FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_invoice: owner delete"
  ON public.project_invoice FOR DELETE
  USING (created_by = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 3. updated_at trigger
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.project_invoice_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_invoice_set_updated_at ON public.project_invoice;
CREATE TRIGGER project_invoice_set_updated_at
  BEFORE UPDATE ON public.project_invoice
  FOR EACH ROW EXECUTE FUNCTION public.project_invoice_set_updated_at();
