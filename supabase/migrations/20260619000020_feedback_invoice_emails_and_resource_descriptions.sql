-- Feature 1 & 2: notification email recipient lists.
-- Stores the email addresses that were notified when a work-feedback / invoice
-- was saved. Default empty array. Additive, RLS inherited from existing policies.
ALTER TABLE public.project_work_feedback
  ADD COLUMN IF NOT EXISTS emails text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.internal_project_work_feedback
  ADD COLUMN IF NOT EXISTS emails text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.invoice
  ADD COLUMN IF NOT EXISTS emails text[] NOT NULL DEFAULT '{}';

-- Feature 3: free-form descriptions for shared files / links / videos.
ALTER TABLE public.project_file
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.project_link
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.project_video
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.internal_project_file
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.internal_project_link
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.internal_project_video
  ADD COLUMN IF NOT EXISTS description text;
