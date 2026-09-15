-- Project Time Aggregates — Step 1 (additive, safe to ship)
--
-- Adds six project-level aggregate columns that replace the per-milestone
-- rollups previously kept in `client_milestone_total` / `qa_milestone_total`.
-- The old tables remain in place until step 2 (see
-- 20260421000001_project_time_aggregates_drop.sql) so the app can keep
-- running mid-refactor.

ALTER TABLE public.project
  ADD COLUMN IF NOT EXISTS client_developer_estimated_time numeric,
  ADD COLUMN IF NOT EXISTS client_developer_real_time      numeric,
  ADD COLUMN IF NOT EXISTS qa_developer_estimated_time     numeric,
  ADD COLUMN IF NOT EXISTS qa_developer_real_time          numeric,
  ADD COLUMN IF NOT EXISTS qa_tester_estimated_time        numeric,
  ADD COLUMN IF NOT EXISTS qa_tester_real_time             numeric;

-- Backfill from existing milestone totals by summing across all milestones
-- belonging to each project.
WITH client_sums AS (
  SELECT project_id,
         SUM(estimated_time_h) AS est_sum,
         SUM(real_time_h)      AS real_sum
  FROM public.client_milestone_total
  GROUP BY project_id
), qa_sums AS (
  SELECT project_id,
         SUM(developer_estimated_time_h) AS dev_est_sum,
         SUM(developer_real_time_h)      AS dev_real_sum,
         SUM(qa_estimated_time_h)        AS tester_est_sum,
         SUM(qa_real_time_h)             AS tester_real_sum
  FROM public.qa_milestone_total
  GROUP BY project_id
)
UPDATE public.project p
SET client_developer_estimated_time = c.est_sum,
    client_developer_real_time      = c.real_sum,
    qa_developer_estimated_time     = q.dev_est_sum,
    qa_developer_real_time          = q.dev_real_sum,
    qa_tester_estimated_time        = q.tester_est_sum,
    qa_tester_real_time             = q.tester_real_sum
FROM client_sums c
FULL OUTER JOIN qa_sums q ON q.project_id = c.project_id
WHERE p.id = COALESCE(c.project_id, q.project_id);
