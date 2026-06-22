-- Dashboard rollup view: monthly hours logged per team member, per project.
--
-- Powers the "Team workload" chart on /dashboard, which shows the percentage
-- of each team member's logged hours that went to each project / internal
-- project, per calendar month.
--
-- Both work-feedback tables carry: created_by (the team member), date (the
-- work-period start, always present — used to bucket by month), total_time
-- (hours for that period) and a project FK. This view normalizes the two
-- tables into a single per-(member, month, project) hours rollup and joins in
-- the readable member + project names so the app doesn't need extra round-trips.
--
-- SECURITY: created WITH (security_invoker = true) so the view runs with the
-- QUERYING user's privileges, not the view owner's. Views in PG15+ bypass RLS
-- by default; security_invoker makes the underlying tables' RLS policies apply
-- to whoever selects from the view. The /dashboard page is admin/manager only
-- (and the feedback-table RLS already grants admin/manager full read), so this
-- is safe while still defending the view if it is ever queried by another role.
--
-- Append-only. CREATE OR REPLACE makes it safe to re-run.

CREATE OR REPLACE VIEW public.dashboard_member_project_hours
WITH (security_invoker = true) AS
WITH combined AS (
  SELECT
    created_by                          AS member_id,
    (date_trunc('month', date))::date   AS month,
    'project'::text                     AS project_kind,
    project_id                          AS project_id,
    total_time
  FROM public.project_work_feedback
  WHERE project_id IS NOT NULL

  UNION ALL

  SELECT
    created_by,
    (date_trunc('month', date))::date,
    'internal'::text,
    internal_project_id,
    total_time
  FROM public.internal_project_work_feedback
  WHERE internal_project_id IS NOT NULL
)
SELECT
  c.member_id,
  p.first_name,
  p.last_name,
  c.month,
  c.project_kind,
  c.project_id,
  COALESCE(pr.name, ip.name, 'Unknown')         AS project_name,
  SUM(COALESCE(c.total_time, 0))::numeric        AS hours,
  COUNT(*)::int                                  AS entries
FROM combined c
LEFT JOIN public.profiles         p  ON p.id = c.member_id
LEFT JOIN public.project          pr ON c.project_kind = 'project'  AND pr.id = c.project_id
LEFT JOIN public.internal_project ip ON c.project_kind = 'internal' AND ip.id = c.project_id
GROUP BY
  c.member_id, p.first_name, p.last_name,
  c.month, c.project_kind, c.project_id, pr.name, ip.name;

COMMENT ON VIEW public.dashboard_member_project_hours IS
  'Monthly hours logged per team member per project (union of both work-feedback tables). security_invoker — RLS of underlying tables applies to the querying user.';

-- The view lives in the exposed `public` schema. Grant read to authenticated
-- users only (never anon). Combined with security_invoker + base-table RLS,
-- each user still only sees rows their feedback-table policies allow.
GRANT SELECT ON public.dashboard_member_project_hours TO authenticated;

NOTIFY pgrst, 'reload schema';
