-- ============================================================
-- Migration: task priority/category, idea-scoped playbook,
--            sop_version permissions, invoice rename + RLS
-- Applied with: npx supabase migration up (NOT db reset)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Task priority + category enums & columns
--    (priority_level was integer + unused → swap cleanly)
-- ─────────────────────────────────────────
CREATE TYPE public.os_task_priority_level AS ENUM ('critical', 'high', 'medium', 'low', 'trivial');

CREATE TYPE public.os_task_category AS ENUM (
  'main_task',
  'bug',
  'ui_ux_improvement',
  'performance_improvement',
  'code_improvement',
  'new_feature',
  'security_vulnerability'
);

ALTER TABLE public.project_task DROP COLUMN IF EXISTS priority_level;
ALTER TABLE public.project_task ADD COLUMN priority_level public.os_task_priority_level;
ALTER TABLE public.project_task ADD COLUMN category public.os_task_category;

-- ─────────────────────────────────────────
-- 2. Ideas-Refiner Playbook: make the project playbook tables idea-linkable
-- ─────────────────────────────────────────
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'playbook';

ALTER TABLE public.project_playbook_version
  ADD COLUMN idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.project_playbook_comment
  ADD COLUMN idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.project_playbook_comment_reply
  ADD COLUMN idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;

-- idea-scoped rows have no project → relax NOT NULL on project_id
ALTER TABLE public.project_playbook_comment       ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE public.project_playbook_comment_reply ALTER COLUMN project_id DROP NOT NULL;

-- Idea-scoped RLS (project-scoped policies stay intact for rows with project_id).
-- project_playbook_version
CREATE POLICY "project_playbook_version: idea creator all" ON public.project_playbook_version
  USING (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_version.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_version.idea_id AND i.created_by = auth.uid()));
CREATE POLICY "project_playbook_version: idea authorized read" ON public.project_playbook_version FOR SELECT
  USING (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_version.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- project_playbook_comment
CREATE POLICY "project_playbook_comment: idea creator all" ON public.project_playbook_comment
  USING (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment.idea_id AND i.created_by = auth.uid()));
CREATE POLICY "project_playbook_comment: idea authorized read" ON public.project_playbook_comment FOR SELECT
  USING (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment.idea_id AND auth.uid() = ANY(i.authorized_users)));
CREATE POLICY "project_playbook_comment: idea authorized insert" ON public.project_playbook_comment FOR INSERT
  WITH CHECK (idea_id IS NOT NULL AND created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- project_playbook_comment_reply
CREATE POLICY "project_playbook_comment_reply: idea creator all" ON public.project_playbook_comment_reply
  USING (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment_reply.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment_reply.idea_id AND i.created_by = auth.uid()));
CREATE POLICY "project_playbook_comment_reply: idea authorized read" ON public.project_playbook_comment_reply FOR SELECT
  USING (idea_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment_reply.idea_id AND auth.uid() = ANY(i.authorized_users)));
CREATE POLICY "project_playbook_comment_reply: idea authorized insert" ON public.project_playbook_comment_reply FOR INSERT
  WITH CHECK (idea_id IS NOT NULL AND created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.idea i WHERE i.id = project_playbook_comment_reply.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- ─────────────────────────────────────────
-- 3. SOP versions: backfill created_by, drop authorized_users, rework RLS
-- ─────────────────────────────────────────
UPDATE public.sop_version v
  SET created_by = s.created_by
  FROM public.sop s
  WHERE v.sop_id = s.id AND v.created_by IS NULL;

-- Drop policies that reference authorized_users BEFORE dropping the column
DROP POLICY IF EXISTS "sop_version: creator manage own" ON public.sop_version;
DROP POLICY IF EXISTS "sop_version: authorized user read" ON public.sop_version;

ALTER TABLE public.sop_version DROP COLUMN IF EXISTS authorized_users;

CREATE POLICY "sop_version: read" ON public.sop_version FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sop s WHERE s.id = sop_version.sop_id
               AND (s.created_by = auth.uid() OR auth.uid() = ANY(s.authorized_users)))
  );
CREATE POLICY "sop_version: insert" ON public.sop_version FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.sop s WHERE s.id = sop_version.sop_id
                AND (s.created_by = auth.uid() OR auth.uid() = ANY(s.authorized_users)))
  );
CREATE POLICY "sop_version: update" ON public.sop_version FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sop s WHERE s.id = sop_version.sop_id AND s.created_by = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sop s WHERE s.id = sop_version.sop_id AND s.created_by = auth.uid())
  );
CREATE POLICY "sop_version: delete" ON public.sop_version FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sop s WHERE s.id = sop_version.sop_id AND s.created_by = auth.uid())
  );

-- ─────────────────────────────────────────
-- 4. Invoices: rename project_invoice → invoice, drop project_id, creator-only RLS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "project_invoice: admin/manager all"      ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: authorized user insert" ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: creator read"           ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: owner delete"           ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: owner update"           ON public.project_invoice;

ALTER TABLE public.project_invoice DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.project_invoice RENAME TO invoice;

CREATE POLICY "invoice: creator all" ON public.invoice
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
