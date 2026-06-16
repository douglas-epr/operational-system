-- Link daily feedback rows to their corresponding chat messages so edits
-- to feedback also update the message visible in the project chat.

ALTER TABLE public.project_daily_feedback
  ADD COLUMN IF NOT EXISTS conversation_project_external_message_id uuid
    REFERENCES public.conversation_project_external_message(id) ON DELETE SET NULL;

ALTER TABLE public.internal_project_daily_feedback
  ADD COLUMN IF NOT EXISTS conversation_internal_project_message_id uuid
    REFERENCES public.conversation_internal_project_message(id) ON DELETE SET NULL;
