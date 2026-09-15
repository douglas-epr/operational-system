-- Change task.order from INTEGER to NUMERIC to support fractional ordering
ALTER TABLE public.task ALTER COLUMN "order" TYPE NUMERIC USING "order"::NUMERIC;

-- Add real_time automation flags to project table
ALTER TABLE public.project ADD COLUMN IF NOT EXISTS change_automatically_milestone_real_time BOOLEAN DEFAULT TRUE;
ALTER TABLE public.project ADD COLUMN IF NOT EXISTS change_automatically_project_real_time BOOLEAN DEFAULT TRUE;
