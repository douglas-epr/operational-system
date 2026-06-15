-- ── Emoji reaction tables for all 3 chat blocks ───────────────────────────────
--
-- Each table mirrors the structure: parent_id FK + created_by + emoji_code.
-- UNIQUE constraint prevents duplicate reactions (same user, same emoji, same message).
-- RLS policies mirror the parent message table's access rules.
--
-- Blocks:
--   projects      → conversation_project_external_message[_thread]
--   internal_projects → conversation_internal_project_message[_thread]
--   private           → conversation_private_message[_thread]

-- ── 1. Projects external message emoji ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_project_external_message_emoji (
  id                                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_project_external_message_id   UUID NOT NULL
    REFERENCES public.conversation_project_external_message(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_code  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_project_external_message_id, created_by, emoji_code)
);

ALTER TABLE public.conversation_project_external_message_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ext_msg_emoji: select"
  ON public.conversation_project_external_message_emoji FOR SELECT
  USING (
    public.is_admin_or_manager()
    OR EXISTS (
      SELECT 1
      FROM public.conversation_project_external_message m
      JOIN public.project p ON p.id = m.project_id
      WHERE m.id = conversation_project_external_message_emoji.conversation_project_external_message_id
        AND auth.uid() = ANY(p.external_conversation_authorized_users)
    )
  );

CREATE POLICY "ext_msg_emoji: insert"
  ON public.conversation_project_external_message_emoji FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.is_admin_or_manager()
      OR EXISTS (
        SELECT 1
        FROM public.conversation_project_external_message m
        JOIN public.project p ON p.id = m.project_id
        WHERE m.id = conversation_project_external_message_emoji.conversation_project_external_message_id
          AND auth.uid() = ANY(p.external_conversation_authorized_users)
      )
    )
  );

CREATE POLICY "ext_msg_emoji: delete_own"
  ON public.conversation_project_external_message_emoji FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON TABLE public.conversation_project_external_message_emoji TO anon;
GRANT ALL ON TABLE public.conversation_project_external_message_emoji TO authenticated;
GRANT ALL ON TABLE public.conversation_project_external_message_emoji TO service_role;

-- ── 2. Projects external message THREAD emoji ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_project_external_message_thread_emoji (
  id                                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_project_external_message_thread_id   UUID NOT NULL
    REFERENCES public.conversation_project_external_message_thread(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_code  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_project_external_message_thread_id, created_by, emoji_code)
);

ALTER TABLE public.conversation_project_external_message_thread_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ext_msg_thread_emoji: select"
  ON public.conversation_project_external_message_thread_emoji FOR SELECT
  USING (
    public.is_admin_or_manager()
    OR EXISTS (
      SELECT 1
      FROM public.conversation_project_external_message_thread t
      JOIN public.project p ON p.id = t.project_id
      WHERE t.id = conversation_project_external_message_thread_emoji.conversation_project_external_message_thread_id
        AND auth.uid() = ANY(p.external_conversation_authorized_users)
    )
  );

CREATE POLICY "ext_msg_thread_emoji: insert"
  ON public.conversation_project_external_message_thread_emoji FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.is_admin_or_manager()
      OR EXISTS (
        SELECT 1
        FROM public.conversation_project_external_message_thread t
        JOIN public.project p ON p.id = t.project_id
        WHERE t.id = conversation_project_external_message_thread_emoji.conversation_project_external_message_thread_id
          AND auth.uid() = ANY(p.external_conversation_authorized_users)
      )
    )
  );

CREATE POLICY "ext_msg_thread_emoji: delete_own"
  ON public.conversation_project_external_message_thread_emoji FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON TABLE public.conversation_project_external_message_thread_emoji TO anon;
GRANT ALL ON TABLE public.conversation_project_external_message_thread_emoji TO authenticated;
GRANT ALL ON TABLE public.conversation_project_external_message_thread_emoji TO service_role;

-- ── 3. Internal-project message emoji ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_internal_project_message_emoji (
  id                                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_internal_project_message_id UUID NOT NULL
    REFERENCES public.conversation_internal_project_message(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_code  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_internal_project_message_id, created_by, emoji_code)
);

ALTER TABLE public.conversation_internal_project_message_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "int_msg_emoji: select"
  ON public.conversation_internal_project_message_emoji FOR SELECT TO authenticated
  USING (
    public.get_user_type() = ANY (ARRAY[
      'admin'::public.os_user_type,
      'manager'::public.os_user_type,
      'operational'::public.os_user_type
    ])
  );

CREATE POLICY "int_msg_emoji: insert"
  ON public.conversation_internal_project_message_emoji FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.get_user_type() = ANY (ARRAY[
      'admin'::public.os_user_type,
      'manager'::public.os_user_type,
      'operational'::public.os_user_type
    ])
  );

CREATE POLICY "int_msg_emoji: delete_own"
  ON public.conversation_internal_project_message_emoji FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON TABLE public.conversation_internal_project_message_emoji TO anon;
GRANT ALL ON TABLE public.conversation_internal_project_message_emoji TO authenticated;
GRANT ALL ON TABLE public.conversation_internal_project_message_emoji TO service_role;

-- ── 4. Internal-project message THREAD emoji ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_internal_project_message_thread_emoji (
  id                                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_internal_project_message_thread_id UUID NOT NULL
    REFERENCES public.conversation_internal_project_message_thread(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_code  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_internal_project_message_thread_id, created_by, emoji_code)
);

ALTER TABLE public.conversation_internal_project_message_thread_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "int_msg_thread_emoji: select"
  ON public.conversation_internal_project_message_thread_emoji FOR SELECT TO authenticated
  USING (
    public.get_user_type() = ANY (ARRAY[
      'admin'::public.os_user_type,
      'manager'::public.os_user_type,
      'operational'::public.os_user_type
    ])
  );

CREATE POLICY "int_msg_thread_emoji: insert"
  ON public.conversation_internal_project_message_thread_emoji FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.get_user_type() = ANY (ARRAY[
      'admin'::public.os_user_type,
      'manager'::public.os_user_type,
      'operational'::public.os_user_type
    ])
  );

CREATE POLICY "int_msg_thread_emoji: delete_own"
  ON public.conversation_internal_project_message_thread_emoji FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON TABLE public.conversation_internal_project_message_thread_emoji TO anon;
GRANT ALL ON TABLE public.conversation_internal_project_message_thread_emoji TO authenticated;
GRANT ALL ON TABLE public.conversation_internal_project_message_thread_emoji TO service_role;

-- ── 5. Private message emoji ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_private_message_emoji (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_private_message_id UUID NOT NULL
    REFERENCES public.conversation_private_message(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_code  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_private_message_id, created_by, emoji_code)
);

ALTER TABLE public.conversation_private_message_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "priv_msg_emoji: select"
  ON public.conversation_private_message_emoji FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversation_private_message m
      JOIN public.conversation_private c ON c.id = m.conversation_id
      WHERE m.id = conversation_private_message_emoji.conversation_private_message_id
        AND auth.uid() = ANY(c.participant_user_ids)
    )
  );

CREATE POLICY "priv_msg_emoji: insert"
  ON public.conversation_private_message_emoji FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM public.conversation_private_message m
      JOIN public.conversation_private c ON c.id = m.conversation_id
      WHERE m.id = conversation_private_message_emoji.conversation_private_message_id
        AND auth.uid() = ANY(c.participant_user_ids)
    )
  );

CREATE POLICY "priv_msg_emoji: delete_own"
  ON public.conversation_private_message_emoji FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON TABLE public.conversation_private_message_emoji TO anon;
GRANT ALL ON TABLE public.conversation_private_message_emoji TO authenticated;
GRANT ALL ON TABLE public.conversation_private_message_emoji TO service_role;

-- ── 6. Private message THREAD emoji ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_private_message_thread_emoji (
  id                                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_private_message_thread_id UUID NOT NULL
    REFERENCES public.conversation_private_message_thread(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_code  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_private_message_thread_id, created_by, emoji_code)
);

ALTER TABLE public.conversation_private_message_thread_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "priv_msg_thread_emoji: select"
  ON public.conversation_private_message_thread_emoji FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversation_private_message_thread t
      JOIN public.conversation_private c ON c.id = t.conversation_id
      WHERE t.id = conversation_private_message_thread_emoji.conversation_private_message_thread_id
        AND auth.uid() = ANY(c.participant_user_ids)
    )
  );

CREATE POLICY "priv_msg_thread_emoji: insert"
  ON public.conversation_private_message_thread_emoji FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM public.conversation_private_message_thread t
      JOIN public.conversation_private c ON c.id = t.conversation_id
      WHERE t.id = conversation_private_message_thread_emoji.conversation_private_message_thread_id
        AND auth.uid() = ANY(c.participant_user_ids)
    )
  );

CREATE POLICY "priv_msg_thread_emoji: delete_own"
  ON public.conversation_private_message_thread_emoji FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON TABLE public.conversation_private_message_thread_emoji TO anon;
GRANT ALL ON TABLE public.conversation_private_message_thread_emoji TO authenticated;
GRANT ALL ON TABLE public.conversation_private_message_thread_emoji TO service_role;
