-- ============================================================
-- Migration: rename project_playbook_* → idea_playbook_*
--            drop project_id from all 3 tables
--            rename project_playbook_comment_id → idea_playbook_comment_id
--            new creator-only RLS for versions; authorized-user RLS for comments/replies
--            cascade delete: deleting a comment deletes all its replies (pre-existing FK)
-- Applied with: npx supabase migration up (NOT db reset)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Drop all existing RLS policies on the 3 tables
-- ─────────────────────────────────────────

-- version policies (from baseline)
DROP POLICY IF EXISTS "project_playbook_version: admin/manager all"    ON public.project_playbook_version;
DROP POLICY IF EXISTS "project_playbook_version: project member read"  ON public.project_playbook_version;
-- version policies (from 20260614120000 migration)
DROP POLICY IF EXISTS "project_playbook_version: idea creator all"     ON public.project_playbook_version;
DROP POLICY IF EXISTS "project_playbook_version: idea authorized read" ON public.project_playbook_version;

-- comment policies (from baseline)
DROP POLICY IF EXISTS "project_playbook_comment: admin/manager all"       ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: authorized user insert"  ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: authorized user read"    ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: owner delete"            ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: owner update"            ON public.project_playbook_comment;
-- comment policies (from 20260614120000 migration)
DROP POLICY IF EXISTS "project_playbook_comment: idea creator all"        ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: idea authorized read"    ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: idea authorized insert"  ON public.project_playbook_comment;

-- reply policies (from baseline)
DROP POLICY IF EXISTS "project_playbook_comment_reply: admin/manager all"       ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: authorized user insert"  ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: authorized user read"    ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: owner delete"            ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: owner update"            ON public.project_playbook_comment_reply;
-- reply policies (from 20260614120000 migration)
DROP POLICY IF EXISTS "project_playbook_comment_reply: idea creator all"        ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: idea authorized read"    ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: idea authorized insert"  ON public.project_playbook_comment_reply;

-- ─────────────────────────────────────────
-- 2. Drop project_id columns from all 3 tables
--    PostgreSQL auto-drops FK constraints + indexes on the dropped column.
-- ─────────────────────────────────────────

ALTER TABLE public.project_playbook_version        DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.project_playbook_comment        DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.project_playbook_comment_reply  DROP COLUMN IF EXISTS project_id;

-- ─────────────────────────────────────────
-- 3. Rename comment-id column in replies
--    PostgreSQL preserves the FK (project_playbook_comment_reply → project_playbook_comment)
--    and the ON DELETE CASCADE through the rename.
-- ─────────────────────────────────────────

ALTER TABLE public.project_playbook_comment_reply
  RENAME COLUMN project_playbook_comment_id TO idea_playbook_comment_id;

-- ─────────────────────────────────────────
-- 4. Rename the tables
--    All FK references pointing TO these tables are automatically updated.
-- ─────────────────────────────────────────

ALTER TABLE public.project_playbook_version        RENAME TO idea_playbook_version;
ALTER TABLE public.project_playbook_comment        RENAME TO idea_playbook_comment;
ALTER TABLE public.project_playbook_comment_reply  RENAME TO idea_playbook_comment_reply;

-- ─────────────────────────────────────────
-- 5. New RLS policies
-- ─────────────────────────────────────────

-- idea_playbook_version: only the creator can CRUD their own versions
CREATE POLICY "idea_playbook_version: creator all" ON public.idea_playbook_version
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- idea_playbook_comment:
--   • the creator of the linked version can CRUD ALL comments on their version
--   • users in idea.authorized_users (via version.idea_id) can CRUD their OWN comments
CREATE POLICY "idea_playbook_comment: version creator all" ON public.idea_playbook_comment
  USING (
    EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      WHERE v.id = idea_playbook_comment.playbook_id
        AND v.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      WHERE v.id = idea_playbook_comment.playbook_id
        AND v.created_by = auth.uid()
    )
  );

CREATE POLICY "idea_playbook_comment: authorized user own" ON public.idea_playbook_comment
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      JOIN public.idea i ON i.id = v.idea_id
      WHERE v.id = idea_playbook_comment.playbook_id
        AND auth.uid() = ANY(i.authorized_users)
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      JOIN public.idea i ON i.id = v.idea_id
      WHERE v.id = idea_playbook_comment.playbook_id
        AND auth.uid() = ANY(i.authorized_users)
    )
  );

-- idea_playbook_comment_reply:
--   • version creator can CRUD ALL replies on their version's comments
--   • authorized users can CRUD their OWN replies
CREATE POLICY "idea_playbook_comment_reply: version creator all" ON public.idea_playbook_comment_reply
  USING (
    EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      WHERE v.id = idea_playbook_comment_reply.playbook_id
        AND v.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      WHERE v.id = idea_playbook_comment_reply.playbook_id
        AND v.created_by = auth.uid()
    )
  );

CREATE POLICY "idea_playbook_comment_reply: authorized user own" ON public.idea_playbook_comment_reply
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      JOIN public.idea i ON i.id = v.idea_id
      WHERE v.id = idea_playbook_comment_reply.playbook_id
        AND auth.uid() = ANY(i.authorized_users)
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.idea_playbook_version v
      JOIN public.idea i ON i.id = v.idea_id
      WHERE v.id = idea_playbook_comment_reply.playbook_id
        AND auth.uid() = ANY(i.authorized_users)
    )
  );
