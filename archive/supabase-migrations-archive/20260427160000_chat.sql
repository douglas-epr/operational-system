-- Chat: Slack-like multi-block messaging hub.
-- Adds:
--   1. Enum os_message_author_type (user, chatbot)
--   2. Two mirrored UUID[] columns on project (auto-filled from authorized_users)
--      via BEFORE INSERT/UPDATE trigger that filters by profiles.type.
--   3. 8 message + thread tables for the four conversation flavors
--      (external project, internal project, internal-project, private 1:1).
--   4. private_conversation (one row per 1:1) and private_chatbot[_message]
--      (per-user AI sessions).
--   5. RLS on every new table.
--   6. Storage bucket chat-attachments (public read, auth write,
--      owner-only update/delete) — mirrors task-comment-attachments.
--
-- The "external" / "internal" project conversations don't need a separate
-- "conversation" row — auth comes from the new project.*_authorized_users
-- columns, and the message tables FK directly to project.id.
-- Internal-project conversations gate via get_user_type() IN
-- ('admin','manager','operational') because internal_project_assignees no
-- longer exists in the current schema.

-- ── 1. Enum ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.os_message_author_type AS ENUM ('user', 'chatbot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. project: two new authorized-users mirrors + auto-population trigger
ALTER TABLE public.project
  ADD COLUMN IF NOT EXISTS external_conversation_authorized_users UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internal_conversation_authorized_users UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS project_ext_conv_auth_idx
  ON public.project USING GIN (external_conversation_authorized_users);
CREATE INDEX IF NOT EXISTS project_int_conv_auth_idx
  ON public.project USING GIN (internal_conversation_authorized_users);

CREATE OR REPLACE FUNCTION public.fill_project_conversation_users()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- External conversation: staff + clients (everyone but qa/referrer/lead/dev-only edge cases — clients are kept since they participate in their own project chat).
  NEW.external_conversation_authorized_users := COALESCE(
    (SELECT array_agg(p.id) FROM profiles p
      WHERE p.id = ANY(NEW.authorized_users)
        AND p.type IN ('admin','manager','operational','developer','client')),
    '{}'::UUID[]);
  -- Internal conversation: staff only (no clients, no qa).
  NEW.internal_conversation_authorized_users := COALESCE(
    (SELECT array_agg(p.id) FROM profiles p
      WHERE p.id = ANY(NEW.authorized_users)
        AND p.type IN ('admin','manager','operational','developer')),
    '{}'::UUID[]);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS project_fill_conversation_users ON public.project;
CREATE TRIGGER project_fill_conversation_users
  BEFORE INSERT OR UPDATE OF authorized_users ON public.project
  FOR EACH ROW EXECUTE FUNCTION public.fill_project_conversation_users();

-- Backfill existing rows by re-firing the trigger.
UPDATE public.project SET authorized_users = authorized_users;

-- ── 3a. External project conversation: top-level + thread ─────────────────
CREATE TABLE IF NOT EXISTS public.external_conversation_project_message (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_type       public.os_message_author_type NOT NULL DEFAULT 'user',
  message           TEXT NOT NULL,
  attachments       JSONB NOT NULL DEFAULT '[]'::jsonb,
  links             TEXT[] NOT NULL DEFAULT '{}',
  is_daily_feedback BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ext_conv_proj_msg_proj_idx
  ON public.external_conversation_project_message (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.external_conversation_project_message_thread (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES public.external_conversation_project_message(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  links       TEXT[] NOT NULL DEFAULT '{}',
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ext_conv_proj_msg_thread_parent_idx
  ON public.external_conversation_project_message_thread (parent_id, created_at);

-- ── 3b. Internal project conversation: top-level + thread ─────────────────
CREATE TABLE IF NOT EXISTS public.internal_conversation_project_message (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_type       public.os_message_author_type NOT NULL DEFAULT 'user',
  message           TEXT NOT NULL,
  attachments       JSONB NOT NULL DEFAULT '[]'::jsonb,
  links             TEXT[] NOT NULL DEFAULT '{}',
  is_daily_feedback BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS int_conv_proj_msg_proj_idx
  ON public.internal_conversation_project_message (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.internal_conversation_project_message_thread (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES public.internal_conversation_project_message(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  links       TEXT[] NOT NULL DEFAULT '{}',
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS int_conv_proj_msg_thread_parent_idx
  ON public.internal_conversation_project_message_thread (parent_id, created_at);

-- ── 3c. Internal-project conversation: top-level + thread ─────────────────
CREATE TABLE IF NOT EXISTS public.conversation_internal_project_message (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_project_id UUID NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_type         public.os_message_author_type NOT NULL DEFAULT 'user',
  message             TEXT NOT NULL,
  attachments         JSONB NOT NULL DEFAULT '[]'::jsonb,
  links               TEXT[] NOT NULL DEFAULT '{}',
  is_daily_feedback   BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS conv_int_proj_msg_proj_idx
  ON public.conversation_internal_project_message (internal_project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.conversation_internal_project_message_thread (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID NOT NULL REFERENCES public.conversation_internal_project_message(id) ON DELETE CASCADE,
  internal_project_id UUID NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message             TEXT NOT NULL,
  attachments         JSONB NOT NULL DEFAULT '[]'::jsonb,
  links               TEXT[] NOT NULL DEFAULT '{}',
  edited_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS conv_int_proj_msg_thread_parent_idx
  ON public.conversation_internal_project_message_thread (parent_id, created_at);

-- ── 3d. Private 1:1 conversation: container + messages + threads ─────────
CREATE TABLE IF NOT EXISTS public.private_conversation (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_user_ids UUID[] NOT NULL,
  created_by           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS priv_conv_participants_idx
  ON public.private_conversation USING GIN (participant_user_ids);

CREATE TABLE IF NOT EXISTS public.private_conversation_message (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES public.private_conversation(id) ON DELETE CASCADE,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_type       public.os_message_author_type NOT NULL DEFAULT 'user',
  message           TEXT NOT NULL,
  attachments       JSONB NOT NULL DEFAULT '[]'::jsonb,
  links             TEXT[] NOT NULL DEFAULT '{}',
  is_daily_feedback BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS priv_conv_msg_conv_idx
  ON public.private_conversation_message (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.private_conversation_message_thread (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID NOT NULL REFERENCES public.private_conversation_message(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.private_conversation(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  attachments     JSONB NOT NULL DEFAULT '[]'::jsonb,
  links           TEXT[] NOT NULL DEFAULT '{}',
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS priv_conv_msg_thread_parent_idx
  ON public.private_conversation_message_thread (parent_id, created_at);

-- ── 3e. ChatBot ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.private_chatbot (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New chat',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS priv_chatbot_owner_idx
  ON public.private_chatbot (owner_id, updated_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_private_chatbot ON public.private_chatbot;
CREATE TRIGGER set_updated_at_private_chatbot
  BEFORE UPDATE ON public.private_chatbot
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.private_chatbot_message (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  UUID NOT NULL REFERENCES public.private_chatbot(id) ON DELETE CASCADE,
  author_type public.os_message_author_type NOT NULL,
  message     TEXT NOT NULL,
  tool_calls  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS priv_chatbot_msg_chatbot_idx
  ON public.private_chatbot_message (chatbot_id, created_at);

-- ── 4. RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.external_conversation_project_message              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_conversation_project_message_thread       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_conversation_project_message              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_conversation_project_message_thread       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_internal_project_message              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_internal_project_message_thread       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversation                               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversation_message                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversation_message_thread                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chatbot                                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chatbot_message                            ENABLE ROW LEVEL SECURITY;

-- 4a. External project msg
CREATE POLICY "ext_conv_proj_msg: select" ON public.external_conversation_project_message
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT unnest(p.external_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "ext_conv_proj_msg: insert" ON public.external_conversation_project_message
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND auth.uid() IN (
    SELECT unnest(p.external_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "ext_conv_proj_msg: update_own" ON public.external_conversation_project_message
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ext_conv_proj_msg: delete_own" ON public.external_conversation_project_message
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 4a-thread.
CREATE POLICY "ext_conv_proj_msg_thread: select" ON public.external_conversation_project_message_thread
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT unnest(p.external_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "ext_conv_proj_msg_thread: insert" ON public.external_conversation_project_message_thread
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND auth.uid() IN (
    SELECT unnest(p.external_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "ext_conv_proj_msg_thread: update_own" ON public.external_conversation_project_message_thread
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ext_conv_proj_msg_thread: delete_own" ON public.external_conversation_project_message_thread
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 4b. Internal project msg
CREATE POLICY "int_conv_proj_msg: select" ON public.internal_conversation_project_message
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT unnest(p.internal_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "int_conv_proj_msg: insert" ON public.internal_conversation_project_message
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND auth.uid() IN (
    SELECT unnest(p.internal_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "int_conv_proj_msg: update_own" ON public.internal_conversation_project_message
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "int_conv_proj_msg: delete_own" ON public.internal_conversation_project_message
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "int_conv_proj_msg_thread: select" ON public.internal_conversation_project_message_thread
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT unnest(p.internal_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "int_conv_proj_msg_thread: insert" ON public.internal_conversation_project_message_thread
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND auth.uid() IN (
    SELECT unnest(p.internal_conversation_authorized_users)
    FROM public.project p WHERE p.id = project_id));
CREATE POLICY "int_conv_proj_msg_thread: update_own" ON public.internal_conversation_project_message_thread
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "int_conv_proj_msg_thread: delete_own" ON public.internal_conversation_project_message_thread
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 4c. Internal-project msg (gated by staff role — same as internal_project itself)
CREATE POLICY "conv_int_proj_msg: select" ON public.conversation_internal_project_message
  FOR SELECT TO authenticated USING (
    public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));
CREATE POLICY "conv_int_proj_msg: insert" ON public.conversation_internal_project_message
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND
    public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));
CREATE POLICY "conv_int_proj_msg: update_own" ON public.conversation_internal_project_message
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "conv_int_proj_msg: delete_own" ON public.conversation_internal_project_message
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "conv_int_proj_msg_thread: select" ON public.conversation_internal_project_message_thread
  FOR SELECT TO authenticated USING (
    public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));
CREATE POLICY "conv_int_proj_msg_thread: insert" ON public.conversation_internal_project_message_thread
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND
    public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));
CREATE POLICY "conv_int_proj_msg_thread: update_own" ON public.conversation_internal_project_message_thread
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "conv_int_proj_msg_thread: delete_own" ON public.conversation_internal_project_message_thread
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 4d. Private conversation
CREATE POLICY "priv_conv: select" ON public.private_conversation
  FOR SELECT TO authenticated USING (auth.uid() = ANY(participant_user_ids));
CREATE POLICY "priv_conv: insert" ON public.private_conversation
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND auth.uid() = ANY(participant_user_ids));
CREATE POLICY "priv_conv: delete_own" ON public.private_conversation
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "priv_conv_msg: select" ON public.private_conversation_message
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT unnest(c.participant_user_ids)
    FROM public.private_conversation c WHERE c.id = conversation_id));
CREATE POLICY "priv_conv_msg: insert" ON public.private_conversation_message
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND auth.uid() IN (
    SELECT unnest(c.participant_user_ids)
    FROM public.private_conversation c WHERE c.id = conversation_id));
CREATE POLICY "priv_conv_msg: update_own" ON public.private_conversation_message
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "priv_conv_msg: delete_own" ON public.private_conversation_message
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "priv_conv_msg_thread: select" ON public.private_conversation_message_thread
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT unnest(c.participant_user_ids)
    FROM public.private_conversation c WHERE c.id = conversation_id));
CREATE POLICY "priv_conv_msg_thread: insert" ON public.private_conversation_message_thread
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND auth.uid() IN (
    SELECT unnest(c.participant_user_ids)
    FROM public.private_conversation c WHERE c.id = conversation_id));
CREATE POLICY "priv_conv_msg_thread: update_own" ON public.private_conversation_message_thread
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "priv_conv_msg_thread: delete_own" ON public.private_conversation_message_thread
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 4e. ChatBot
CREATE POLICY "priv_chatbot: all_own" ON public.private_chatbot
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "priv_chatbot_msg: select" ON public.private_chatbot_message
  FOR SELECT TO authenticated USING (auth.uid() IN (
    SELECT b.owner_id FROM public.private_chatbot b WHERE b.id = chatbot_id));
CREATE POLICY "priv_chatbot_msg: insert" ON public.private_chatbot_message
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (
    SELECT b.owner_id FROM public.private_chatbot b WHERE b.id = chatbot_id));
CREATE POLICY "priv_chatbot_msg: delete_own" ON public.private_chatbot_message
  FOR DELETE TO authenticated USING (auth.uid() IN (
    SELECT b.owner_id FROM public.private_chatbot b WHERE b.id = chatbot_id));

-- ── 5. Storage bucket for chat attachments ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat-attachments auth write"  ON storage.objects;
DROP POLICY IF EXISTS "chat-attachments auth update" ON storage.objects;
DROP POLICY IF EXISTS "chat-attachments auth delete" ON storage.objects;
DROP POLICY IF EXISTS "chat-attachments public read" ON storage.objects;

CREATE POLICY "chat-attachments auth write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');
CREATE POLICY "chat-attachments auth update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'chat-attachments' AND owner = auth.uid())
                              WITH CHECK (bucket_id = 'chat-attachments');
CREATE POLICY "chat-attachments auth delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'chat-attachments' AND owner = auth.uid());
CREATE POLICY "chat-attachments public read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'chat-attachments');
