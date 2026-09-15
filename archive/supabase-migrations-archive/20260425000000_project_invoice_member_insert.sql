-- 2026-04-25 — Revised invoice privacy rule.
--
-- Per the updated spec, any member of `project.authorized_users` may create
-- an invoice; admin/manager (via their existing ALL policy) still see every
-- invoice on the project, while everyone else only sees invoices they
-- themselves created (the "creator read" policy added on 2026-04-24).
--
-- This migration re-introduces the project-member INSERT policy that the
-- 2026-04-24 hardening pass had removed.

DROP POLICY IF EXISTS "project_invoice: authorized user insert"
  ON public.project_invoice;

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
