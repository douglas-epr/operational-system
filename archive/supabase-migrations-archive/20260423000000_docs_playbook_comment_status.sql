-- Playbook comment status (Pending/Solved) for Google-Docs-style resolvable comments.
-- Adds an enum `os_playbook_comment_status` and a `status` column on
-- `project_playbook_comment`, defaulting to 'pending'. RLS is unchanged:
-- existing "owner update" (creator) and "admin/manager all" policies cover
-- the toggle.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'os_playbook_comment_status') THEN
    CREATE TYPE public.os_playbook_comment_status AS ENUM ('pending', 'solved');
  END IF;
END $$;

ALTER TABLE public.project_playbook_comment
  ADD COLUMN IF NOT EXISTS status public.os_playbook_comment_status NOT NULL DEFAULT 'pending';
