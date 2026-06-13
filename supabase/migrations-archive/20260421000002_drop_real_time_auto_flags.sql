-- Drop the real-time automation flags from `project`.
--
-- The previous model let users toggle whether milestone and project real-time
-- were auto-recalculated. These toggles are no longer needed: real-time always
-- reflects the sum of current time_track / qa_time_track rows, so the app now
-- recalculates unconditionally. Run after the code that still references these
-- columns has been deployed (see ProjectModal.tsx, actions.ts, types/projects.ts).

ALTER TABLE public.project
  DROP COLUMN IF EXISTS change_automatically_milestone_real_time,
  DROP COLUMN IF EXISTS change_automatically_project_real_time;
