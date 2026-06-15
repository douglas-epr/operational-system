-- Create storage buckets for profile avatars and user signatures.
-- Both are public (readable by anyone with the URL).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',         'avatars',         true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('user-signatures', 'user-signatures', true, 2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── avatars bucket policies ──────────────────────────────────────────────────

-- Anyone can view avatar images (public bucket).
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatars.
CREATE POLICY "avatars: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Authenticated users can replace (update) avatar objects.
CREATE POLICY "avatars: authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- ── user-signatures bucket policies ─────────────────────────────────────────

-- Anyone can view signature images.
CREATE POLICY "user-signatures: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-signatures');

-- Users can only upload into their own folder (path = {userId}/{file}).
CREATE POLICY "user-signatures: owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can replace their own signature files.
CREATE POLICY "user-signatures: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own signature files.
CREATE POLICY "user-signatures: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
