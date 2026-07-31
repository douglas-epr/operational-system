-- Add the "What we have now" rich-text field to work feedback.
--
-- Captures the present state of the product/deliverable at the end of the work
-- period, alongside the existing retrospective (`current_work`), forward-looking
-- (`next_work`), and blocker (`blockers`) fields. Stored as rich HTML, same as
-- its sibling columns, and nullable so every existing row stays valid.
--
-- No RLS changes are needed: the policies on both tables are row-level
-- (admin/manager, creator, project member) and column-agnostic.

ALTER TABLE public.project_work_feedback
  ADD COLUMN IF NOT EXISTS current_state TEXT;

ALTER TABLE public.internal_project_work_feedback
  ADD COLUMN IF NOT EXISTS current_state TEXT;

COMMENT ON COLUMN public.project_work_feedback.current_state IS
  'Rich HTML — "What we have now": present state of the deliverable at period end.';

COMMENT ON COLUMN public.internal_project_work_feedback.current_state IS
  'Rich HTML — "What we have now": present state of the deliverable at period end.';
