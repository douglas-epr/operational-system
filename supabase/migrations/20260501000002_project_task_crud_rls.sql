-- ================================================================
-- Migration: 20260501000002_project_task_crud_rls.sql
--
-- Adds INSERT / UPDATE / DELETE policies to project_task so that
-- developers, clients, and QA users can manage tasks in projects
-- they are authorized on.
--
-- Rules:
--   Developer  → INSERT/UPDATE/DELETE any task in their projects
--   Client     → INSERT/UPDATE client_requests tasks in their projects
--                DELETE only own (created_by = auth.uid())
--   QA         → INSERT/UPDATE qa_requests tasks in their projects
--                DELETE only own (created_by = auth.uid())
--
-- NOTE: project_task already has a created_by UUID column (nullable).
--       The application server action must set created_by = auth.uid()
--       on every INSERT from these user types.
-- ================================================================

-- ── Developer ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "task: developer insert" ON public.project_task;
CREATE POLICY "task: developer insert"
  ON public.project_task FOR INSERT
  WITH CHECK (
    public.get_user_type() = 'developer'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

DROP POLICY IF EXISTS "task: developer update" ON public.project_task;
CREATE POLICY "task: developer update"
  ON public.project_task FOR UPDATE
  USING (
    public.get_user_type() = 'developer'
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

DROP POLICY IF EXISTS "task: developer delete" ON public.project_task;
CREATE POLICY "task: developer delete"
  ON public.project_task FOR DELETE
  USING (
    public.get_user_type() = 'developer'
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── Client ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "task: client insert" ON public.project_task;
CREATE POLICY "task: client insert"
  ON public.project_task FOR INSERT
  WITH CHECK (
    public.get_user_type() = 'client'
    AND type = 'client_requests'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

DROP POLICY IF EXISTS "task: client update" ON public.project_task;
CREATE POLICY "task: client update"
  ON public.project_task FOR UPDATE
  USING (
    public.get_user_type() = 'client'
    AND type = 'client_requests'
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

DROP POLICY IF EXISTS "task: client delete own" ON public.project_task;
CREATE POLICY "task: client delete own"
  ON public.project_task FOR DELETE
  USING (
    public.get_user_type() = 'client'
    AND type = 'client_requests'
    AND created_by = auth.uid()
  );

-- ── QA ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "task: qa insert" ON public.project_task;
CREATE POLICY "task: qa insert"
  ON public.project_task FOR INSERT
  WITH CHECK (
    public.get_user_type() = 'qa'
    AND type = 'qa_requests'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

DROP POLICY IF EXISTS "task: qa update" ON public.project_task;
CREATE POLICY "task: qa update"
  ON public.project_task FOR UPDATE
  USING (
    public.get_user_type() = 'qa'
    AND type = 'qa_requests'
    AND EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );

DROP POLICY IF EXISTS "task: qa delete own" ON public.project_task;
CREATE POLICY "task: qa delete own"
  ON public.project_task FOR DELETE
  USING (
    public.get_user_type() = 'qa'
    AND type = 'qa_requests'
    AND created_by = auth.uid()
  );

NOTIFY pgrst, 'reload schema';
