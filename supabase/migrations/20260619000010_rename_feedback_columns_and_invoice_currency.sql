-- Rename today_work → current_work on both work-feedback tables
ALTER TABLE public.project_work_feedback
  RENAME COLUMN today_work TO current_work;

ALTER TABLE public.internal_project_work_feedback
  RENAME COLUMN today_work TO current_work;

-- Rename tomorrow_work → next_work on both work-feedback tables
ALTER TABLE public.project_work_feedback
  RENAME COLUMN tomorrow_work TO next_work;

ALTER TABLE public.internal_project_work_feedback
  RENAME COLUMN tomorrow_work TO next_work;

-- Add currency column to invoice (text, default USD symbol)
ALTER TABLE public.invoice
  ADD COLUMN IF NOT EXISTS currency text DEFAULT '$';

-- Reload PostgREST schema cache
COMMENT ON TABLE public.project_work_feedback IS 'Work feedback per project period';
COMMENT ON TABLE public.internal_project_work_feedback IS 'Work feedback per internal project period';
COMMENT ON TABLE public.invoice IS 'Client invoices with optional work period and currency';
NOTIFY pgrst, 'reload schema';
