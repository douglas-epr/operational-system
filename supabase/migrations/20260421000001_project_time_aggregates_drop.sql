-- Project Time Aggregates — Step 2 (destructive, run AFTER code is deployed)
--
-- The per-milestone rollup tables are no longer read or written by the app.
-- Drop them now that `project.client_developer_*`, `project.qa_developer_*`,
-- and `project.qa_tester_*` hold the canonical values
-- (see 20260421000000_project_time_aggregates_add.sql).

DROP TABLE IF EXISTS public.client_milestone_total;
DROP TABLE IF EXISTS public.qa_milestone_total;
