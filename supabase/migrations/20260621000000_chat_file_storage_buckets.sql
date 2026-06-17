-- Create storage buckets for chat file attachments.
-- Both buckets are public so stored files can be served by URL without auth.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Used by ProjectTabsPanel + InternalProjectTabsPanel (Files tab, 50 MB limit).
  ('project-files',    'project-files',    true, 52428800, NULL),
  -- Used by MessageComposer for inline message attachments (25 MB limit).
  ('chat-attachments', 'chat-attachments', true, 26214400, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── project-files policies ────────────────────────────────────────────────────

CREATE POLICY "project-files: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files');

CREATE POLICY "project-files: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "project-files: authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "project-files: authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files');

-- ── chat-attachments policies ─────────────────────────────────────────────────

CREATE POLICY "chat-attachments: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "chat-attachments: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "chat-attachments: authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "chat-attachments: authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments');
