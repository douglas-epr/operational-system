-- ==========================================================================
-- Task 1: Clean up project table (remove QA / referrer / profit fields,
--         rename client_developer → general_requests)
-- ==========================================================================

-- Drop RLS policies that depend on referrer_id before dropping the column
DROP POLICY IF EXISTS "project: referrer read own" ON public.project;
DROP INDEX IF EXISTS public.project_referrer_id_idx;

-- Drop columns that are no longer needed
ALTER TABLE public.project
  DROP COLUMN IF EXISTS referrer_id,
  DROP COLUMN IF EXISTS referrer_revenue,
  DROP COLUMN IF EXISTS profit,
  DROP COLUMN IF EXISTS qa_developer_estimated_time,
  DROP COLUMN IF EXISTS qa_developer_real_time,
  DROP COLUMN IF EXISTS qa_tester_estimated_time,
  DROP COLUMN IF EXISTS qa_tester_real_time;

-- Rename client_developer_* → general_requests_*
ALTER TABLE public.project
  RENAME COLUMN client_developer_estimated_time TO general_requests_estimated_time;
ALTER TABLE public.project
  RENAME COLUMN client_developer_real_time TO general_requests_real_time;

-- ==========================================================================
-- Task 2: Remove PROJECTS INTERNAL block
--         (conversation_project_internal_message tables + project column)
-- ==========================================================================

DROP POLICY IF EXISTS "int_conv_proj_msg: delete_own"   ON public.conversation_project_internal_message;
DROP POLICY IF EXISTS "int_conv_proj_msg: insert"       ON public.conversation_project_internal_message;
DROP POLICY IF EXISTS "int_conv_proj_msg: select"       ON public.conversation_project_internal_message;
DROP POLICY IF EXISTS "int_conv_proj_msg: update_own"   ON public.conversation_project_internal_message;
DROP POLICY IF EXISTS "int_conv_proj_msg_thread: delete_own" ON public.conversation_project_internal_message_thread;
DROP POLICY IF EXISTS "int_conv_proj_msg_thread: insert"     ON public.conversation_project_internal_message_thread;
DROP POLICY IF EXISTS "int_conv_proj_msg_thread: select"     ON public.conversation_project_internal_message_thread;
DROP POLICY IF EXISTS "int_conv_proj_msg_thread: update_own" ON public.conversation_project_internal_message_thread;

DROP TABLE IF EXISTS public.conversation_project_internal_message_thread;
DROP TABLE IF EXISTS public.conversation_project_internal_message;

-- Drop the chatbot policy that joins project.internal_conversation_authorized_users
DROP POLICY IF EXISTS "project_internal_chatbot_message: members rw" ON public.project_internal_chatbot_message;

-- Remove the internal-conversation membership column (no longer needed)
ALTER TABLE public.project
  DROP COLUMN IF EXISTS internal_conversation_authorized_users;

-- ==========================================================================
-- Task 3: New tables for Internal Project tabs
--         (Files / Links / Videos / Daily Feedback)
-- ==========================================================================

-- ── internal_project_file ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_project_file (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_project_id uuid        NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  attachments         jsonb       NOT NULL DEFAULT '[]',
  created_by          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_project_file ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_project_file: staff all" ON public.internal_project_file
  USING  (public.get_user_type() IN ('admin', 'manager', 'operational'))
  WITH CHECK (public.get_user_type() IN ('admin', 'manager', 'operational') AND created_by = auth.uid());
CREATE POLICY "internal_project_file: admin/manager delete any" ON public.internal_project_file
  FOR DELETE USING (public.is_admin_or_manager());

-- ── internal_project_link ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_project_link (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_project_id uuid        NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  url                 text        NOT NULL,
  created_by          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_project_link ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_project_link: staff all" ON public.internal_project_link
  USING  (public.get_user_type() IN ('admin', 'manager', 'operational'))
  WITH CHECK (public.get_user_type() IN ('admin', 'manager', 'operational') AND created_by = auth.uid());
CREATE POLICY "internal_project_link: admin/manager delete any" ON public.internal_project_link
  FOR DELETE USING (public.is_admin_or_manager());

-- ── internal_project_video ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_project_video (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_project_id uuid        NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  name                text,
  url                 text,
  created_by          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_project_video ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_project_video: staff all" ON public.internal_project_video
  USING  (public.get_user_type() IN ('admin', 'manager', 'operational'))
  WITH CHECK (public.get_user_type() IN ('admin', 'manager', 'operational') AND created_by = auth.uid());
CREATE POLICY "internal_project_video: admin/manager delete any" ON public.internal_project_video
  FOR DELETE USING (public.is_admin_or_manager());

-- ── internal_project_daily_feedback ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_project_daily_feedback (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_project_id uuid        NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  date                date        NOT NULL,
  today_work          text,
  tomorrow_work       text,
  blockers            text,
  video_and_links     text,
  created_by          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_project_daily_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_project_daily_feedback: staff all" ON public.internal_project_daily_feedback
  USING  (public.get_user_type() IN ('admin', 'manager', 'operational'))
  WITH CHECK (public.get_user_type() IN ('admin', 'manager', 'operational') AND created_by = auth.uid());
CREATE POLICY "internal_project_daily_feedback: admin/manager delete any" ON public.internal_project_daily_feedback
  FOR DELETE USING (public.is_admin_or_manager());
