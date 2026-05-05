-- Docs page: Files / Links / Videos / Daily Feedbacks tabs.
--
-- The remote schema already has `created_by` + `updated_at` on all four
-- target tables (see generated types in src/lib/supabase/types.ts).
-- The only missing piece on the column side is `attachments JSONB` on
-- project_file (used to hold the uploaded blobs).
--
-- RLS model (mirrors task_comment / project_playbook_comment):
--   • admin/manager               → full access
--   • project.authorized_users    → SELECT + INSERT (where created_by = self)
--   • row owner (created_by=self) → UPDATE + DELETE
--
-- A public storage bucket `project-files` hosts the uploaded files,
-- following the pattern of `task-comment-attachments`.

-- ────────────────────────────────────────────────────────────────
-- 1. Column additions
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_file
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- project_video.updated_at is nullable in the remote schema; make it
-- consistent with the others so updated_at is always populated.
ALTER TABLE public.project_video
  ALTER COLUMN updated_at SET DEFAULT NOW();

UPDATE public.project_video SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE public.project_video
  ALTER COLUMN updated_at SET NOT NULL;


-- ────────────────────────────────────────────────────────────────
-- 2. Storage bucket: project-files
-- ────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "project-files public read"  ON storage.objects;
DROP POLICY IF EXISTS "project-files auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "project-files owner update" ON storage.objects;
DROP POLICY IF EXISTS "project-files owner delete" ON storage.objects;

CREATE POLICY "project-files public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files');

CREATE POLICY "project-files auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "project-files owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-files' AND owner = auth.uid());

CREATE POLICY "project-files owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-files' AND owner = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 3. RLS: project_file
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_file ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_file: admin/manager all"         ON public.project_file;
DROP POLICY IF EXISTS "project_file: authorized user read"      ON public.project_file;
DROP POLICY IF EXISTS "project_file: authorized user insert"    ON public.project_file;
DROP POLICY IF EXISTS "project_file: owner update"              ON public.project_file;
DROP POLICY IF EXISTS "project_file: owner delete"              ON public.project_file;

CREATE POLICY "project_file: admin/manager all"
  ON public.project_file FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_file: authorized user read"
  ON public.project_file FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_file: authorized user insert"
  ON public.project_file FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_file: owner update"
  ON public.project_file FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_file: owner delete"
  ON public.project_file FOR DELETE
  USING (created_by = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 4. RLS: project_link
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_link: admin/manager all"         ON public.project_link;
DROP POLICY IF EXISTS "project_link: authorized user read"      ON public.project_link;
DROP POLICY IF EXISTS "project_link: authorized user insert"    ON public.project_link;
DROP POLICY IF EXISTS "project_link: owner update"              ON public.project_link;
DROP POLICY IF EXISTS "project_link: owner delete"              ON public.project_link;

CREATE POLICY "project_link: admin/manager all"
  ON public.project_link FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_link: authorized user read"
  ON public.project_link FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_link: authorized user insert"
  ON public.project_link FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_link: owner update"
  ON public.project_link FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_link: owner delete"
  ON public.project_link FOR DELETE
  USING (created_by = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 5. RLS: project_video
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_video ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_video: admin/manager all"        ON public.project_video;
DROP POLICY IF EXISTS "project_video: authorized user read"     ON public.project_video;
DROP POLICY IF EXISTS "project_video: authorized user insert"   ON public.project_video;
DROP POLICY IF EXISTS "project_video: owner update"             ON public.project_video;
DROP POLICY IF EXISTS "project_video: owner delete"             ON public.project_video;

CREATE POLICY "project_video: admin/manager all"
  ON public.project_video FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_video: authorized user read"
  ON public.project_video FOR SELECT
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_video: authorized user insert"
  ON public.project_video FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_video: owner update"
  ON public.project_video FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_video: owner delete"
  ON public.project_video FOR DELETE
  USING (created_by = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 6. RLS: project_daily_feedback
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_daily_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_daily_feedback: admin/manager all"       ON public.project_daily_feedback;
DROP POLICY IF EXISTS "project_daily_feedback: authorized user read"    ON public.project_daily_feedback;
DROP POLICY IF EXISTS "project_daily_feedback: authorized user insert"  ON public.project_daily_feedback;
DROP POLICY IF EXISTS "project_daily_feedback: owner update"            ON public.project_daily_feedback;
DROP POLICY IF EXISTS "project_daily_feedback: owner delete"            ON public.project_daily_feedback;

CREATE POLICY "project_daily_feedback: admin/manager all"
  ON public.project_daily_feedback FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_daily_feedback: authorized user read"
  ON public.project_daily_feedback FOR SELECT
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_daily_feedback: authorized user insert"
  ON public.project_daily_feedback FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_daily_feedback: owner update"
  ON public.project_daily_feedback FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_daily_feedback: owner delete"
  ON public.project_daily_feedback FOR DELETE
  USING (created_by = auth.uid());
