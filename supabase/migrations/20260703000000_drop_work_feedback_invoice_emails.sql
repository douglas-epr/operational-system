-- Drop the email-recipient columns now that the "Notify by email" (work feedback)
-- and "Send by email" (invoice) features have been removed from the app.
--
-- DEPLOY ORDERING: apply this ONLY AFTER the application code that no longer
-- references these columns is deployed. The previous build selected/inserted
-- `emails` on these tables, so dropping the columns before that code ships would
-- break the live work-feedback and invoice forms.
--
-- These columns only stored notification recipient lists (text[]), not business
-- data, so the drop is non-destructive to anything the product still uses.

ALTER TABLE public.project_work_feedback           DROP COLUMN IF EXISTS emails;
ALTER TABLE public.internal_project_work_feedback  DROP COLUMN IF EXISTS emails;
ALTER TABLE public.invoice                          DROP COLUMN IF EXISTS emails;
