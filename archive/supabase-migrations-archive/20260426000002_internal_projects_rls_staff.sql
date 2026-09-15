-- Update RLS so admin, manager, AND operational users can access internal projects.
-- Per docs/reference_docs/paginas.md the page gates on
-- type IN ('admin','manager','operational'). Earlier policies used
-- is_admin_or_manager() which excluded operational users.

DROP POLICY IF EXISTS "internal_project: admin/manager all" ON public.internal_project;
DROP POLICY IF EXISTS "internal_project_assignees: admin/manager all" ON public.internal_project_assignees;
DROP POLICY IF EXISTS "internal_task: admin/manager all" ON public.internal_task;
DROP POLICY IF EXISTS "internal_task_assignees: admin/manager all" ON public.internal_task_assignees;
DROP POLICY IF EXISTS "internal_time_track: admin/manager all" ON public.internal_time_track;

CREATE POLICY "internal_project: staff all" ON public.internal_project
  FOR ALL TO authenticated
  USING (get_user_type() IN ('admin','manager','operational'))
  WITH CHECK (get_user_type() IN ('admin','manager','operational'));

CREATE POLICY "internal_project_assignees: staff all" ON public.internal_project_assignees
  FOR ALL TO authenticated
  USING (get_user_type() IN ('admin','manager','operational'))
  WITH CHECK (get_user_type() IN ('admin','manager','operational'));

CREATE POLICY "internal_task: staff all" ON public.internal_task
  FOR ALL TO authenticated
  USING (get_user_type() IN ('admin','manager','operational'))
  WITH CHECK (get_user_type() IN ('admin','manager','operational'));

CREATE POLICY "internal_task_assignees: staff all" ON public.internal_task_assignees
  FOR ALL TO authenticated
  USING (get_user_type() IN ('admin','manager','operational'))
  WITH CHECK (get_user_type() IN ('admin','manager','operational'));

CREATE POLICY "internal_time_track: staff all" ON public.internal_time_track
  FOR ALL TO authenticated
  USING (get_user_type() IN ('admin','manager','operational'))
  WITH CHECK (get_user_type() IN ('admin','manager','operational'));
