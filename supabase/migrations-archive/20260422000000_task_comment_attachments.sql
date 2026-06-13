-- Task Comment Chat Overhaul
--
-- Adds attachment support (JSONB array of { path, url, name, size, type })
-- and an edited_at timestamp to distinguish edited messages from original
-- posts. Also provisions a public storage bucket for the uploaded files
-- with owner-scoped write access.

ALTER TABLE public.task_comment
  ADD COLUMN IF NOT EXISTS attachments JSONB       NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS edited_at   TIMESTAMPTZ;

-- Storage bucket for chat attachments.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-comment-attachments', 'task-comment-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (bucket is `public`, but the policy must exist explicitly
-- for the getPublicUrl pattern to resolve without a signed URL).
DROP POLICY IF EXISTS "task-comment-attachments public read"  ON storage.objects;
DROP POLICY IF EXISTS "task-comment-attachments auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "task-comment-attachments owner update" ON storage.objects;
DROP POLICY IF EXISTS "task-comment-attachments owner delete" ON storage.objects;

CREATE POLICY "task-comment-attachments public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-comment-attachments');

CREATE POLICY "task-comment-attachments auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-comment-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "task-comment-attachments owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'task-comment-attachments' AND owner = auth.uid());

CREATE POLICY "task-comment-attachments owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'task-comment-attachments' AND owner = auth.uid());
