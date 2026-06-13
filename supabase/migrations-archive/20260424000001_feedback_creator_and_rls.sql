-- ─────────────────────────────────────────────────────────────
-- /feedback page: add created_by + updated_at, refine RLS
-- docs/reference_docs/paginas.md §feedback, tabelas.md §feedback
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- keep updated_at in sync
CREATE OR REPLACE FUNCTION public.feedback_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.feedback;
CREATE TRIGGER trg_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.feedback_set_updated_at();

-- refine RLS to reflect the Bubble semantics:
--   admin/manager    → full access
--   any authed user  → SELECT (the feedback wall is internal-tool-wide)
--   creator          → INSERT with own id, UPDATE own row, DELETE own row
DROP POLICY IF EXISTS "feedback: admin/manager all"   ON public.feedback;
DROP POLICY IF EXISTS "feedback: operational insert"  ON public.feedback;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback: admin/manager all"
  ON public.feedback FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "feedback: authed read"
  ON public.feedback FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "feedback: own insert"
  ON public.feedback FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "feedback: own update"
  ON public.feedback FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "feedback: own delete"
  ON public.feedback FOR DELETE
  USING (created_by = auth.uid());
