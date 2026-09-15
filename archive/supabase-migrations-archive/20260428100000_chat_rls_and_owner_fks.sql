-- Chat: send-message bug fix + chatbot DB-access tightening (2026-04-28, second pass)
--
-- Two bugs surfaced when the manager finally tested live:
--
-- 1. SENDING A MESSAGE BLEW UP for every block.
--    `sendMessage` and `replyInThread` (refactored yesterday to return the
--    full row + joined profile for the optimistic-UI insert) call
--    `.select(... profiles:profiles!owner_id(id,first_name,last_name,picture)
--    ...)`. That join requires a FOREIGN KEY from
--    `<message_table>.owner_id` → `profiles.id` for PostgREST to discover
--    the relationship. Yesterday's migrations never added that FK on any
--    of the 8 message/thread tables — the column was just `uuid NOT NULL`
--    with no constraint. PostgREST therefore refused the embed and the
--    insert returned an error like
--      "Could not find a relationship between 'X' and 'profiles'".
--    The empty-table state masked it during /chat browsing because
--    `getMessages` never had a row to render.
--    Fix: add the FK on all 9 tables (8 chat + private_chatbot_message).
--
-- 2. ADMIN/MANAGER COULD SEE PROJECTS BUT NOT THEIR MESSAGES.
--    The project-listing fix from earlier today already lets admin/manager
--    see every project (RLS on `project` uses `is_admin_or_manager()`),
--    but the four message tables and four thread tables still gate
--    SELECT/INSERT on `auth.uid() IN unnest(*_authorized_users)`. Managers
--    who weren't manually added to the array got 0 rows on read AND a
--    silent RLS rejection on insert. Now that admin-managed membership is
--    a thing (the gear-button modal), keeping that gate is correct for
--    *non-admin* users but admin/manager need to bypass it just like they
--    bypass the project-listing rules.
--    Fix: rewrite the SELECT and INSERT policies on
--      external_conversation_project_message[_thread]
--      internal_conversation_project_message[_thread]
--    so they pass when `is_admin_or_manager()`. The
--    conversation_internal_project_message[_thread] tables already gate on
--    `get_user_type() IN ('admin','manager','operational')` and don't
--    need patching. Private conversation tables stay strict — those are
--    user-to-user DMs and admins should NOT auto-bypass them.

-- ── 1. owner_id FKs to profiles.id ───────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  msg_tables TEXT[] := ARRAY[
    'external_conversation_project_message',
    'external_conversation_project_message_thread',
    'internal_conversation_project_message',
    'internal_conversation_project_message_thread',
    'conversation_internal_project_message',
    'conversation_internal_project_message_thread',
    'private_conversation_message',
    'private_conversation_message_thread'
    -- private_chatbot_message has no `owner_id` column (it's keyed off
    -- chatbot_id; rows are either author_type='user' or 'chatbot') so it
    -- doesn't need a profile FK.
  ];
  fk_name TEXT;
BEGIN
  FOREACH t IN ARRAY msg_tables LOOP
    fk_name := t || '_owner_id_fkey';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class cls ON cls.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = cls.relnamespace
      WHERE n.nspname = 'public' AND cls.relname = t AND c.conname = fk_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I
           FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE',
        t, fk_name
      );
    END IF;
  END LOOP;
END $$;

-- ── 2. RLS: admin/manager bypass on project message + thread tables ──────
-- DROP+CREATE pattern so policies are idempotent on re-run.

-- external_conversation_project_message --------------------------------------
DROP POLICY IF EXISTS "ext_conv_proj_msg: select" ON public.external_conversation_project_message;
CREATE POLICY "ext_conv_proj_msg: select"
  ON public.external_conversation_project_message FOR SELECT
  USING (
    public.is_admin_or_manager()
    OR auth.uid() IN (
      SELECT unnest(p.external_conversation_authorized_users)
      FROM public.project p
      WHERE p.id = external_conversation_project_message.project_id
    )
  );

DROP POLICY IF EXISTS "ext_conv_proj_msg: insert" ON public.external_conversation_project_message;
CREATE POLICY "ext_conv_proj_msg: insert"
  ON public.external_conversation_project_message FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (
      public.is_admin_or_manager()
      OR auth.uid() IN (
        SELECT unnest(p.external_conversation_authorized_users)
        FROM public.project p
        WHERE p.id = external_conversation_project_message.project_id
      )
    )
  );

-- external_conversation_project_message_thread -------------------------------
DROP POLICY IF EXISTS "ext_conv_proj_msg_thread: select" ON public.external_conversation_project_message_thread;
CREATE POLICY "ext_conv_proj_msg_thread: select"
  ON public.external_conversation_project_message_thread FOR SELECT
  USING (
    public.is_admin_or_manager()
    OR auth.uid() IN (
      SELECT unnest(p.external_conversation_authorized_users)
      FROM public.project p
      WHERE p.id = external_conversation_project_message_thread.project_id
    )
  );

DROP POLICY IF EXISTS "ext_conv_proj_msg_thread: insert" ON public.external_conversation_project_message_thread;
CREATE POLICY "ext_conv_proj_msg_thread: insert"
  ON public.external_conversation_project_message_thread FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (
      public.is_admin_or_manager()
      OR auth.uid() IN (
        SELECT unnest(p.external_conversation_authorized_users)
        FROM public.project p
        WHERE p.id = external_conversation_project_message_thread.project_id
      )
    )
  );

-- internal_conversation_project_message --------------------------------------
DROP POLICY IF EXISTS "int_conv_proj_msg: select" ON public.internal_conversation_project_message;
CREATE POLICY "int_conv_proj_msg: select"
  ON public.internal_conversation_project_message FOR SELECT
  USING (
    public.is_admin_or_manager()
    OR auth.uid() IN (
      SELECT unnest(p.internal_conversation_authorized_users)
      FROM public.project p
      WHERE p.id = internal_conversation_project_message.project_id
    )
  );

DROP POLICY IF EXISTS "int_conv_proj_msg: insert" ON public.internal_conversation_project_message;
CREATE POLICY "int_conv_proj_msg: insert"
  ON public.internal_conversation_project_message FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (
      public.is_admin_or_manager()
      OR auth.uid() IN (
        SELECT unnest(p.internal_conversation_authorized_users)
        FROM public.project p
        WHERE p.id = internal_conversation_project_message.project_id
      )
    )
  );

-- internal_conversation_project_message_thread -------------------------------
DROP POLICY IF EXISTS "int_conv_proj_msg_thread: select" ON public.internal_conversation_project_message_thread;
CREATE POLICY "int_conv_proj_msg_thread: select"
  ON public.internal_conversation_project_message_thread FOR SELECT
  USING (
    public.is_admin_or_manager()
    OR auth.uid() IN (
      SELECT unnest(p.internal_conversation_authorized_users)
      FROM public.project p
      WHERE p.id = internal_conversation_project_message_thread.project_id
    )
  );

DROP POLICY IF EXISTS "int_conv_proj_msg_thread: insert" ON public.internal_conversation_project_message_thread;
CREATE POLICY "int_conv_proj_msg_thread: insert"
  ON public.internal_conversation_project_message_thread FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (
      public.is_admin_or_manager()
      OR auth.uid() IN (
        SELECT unnest(p.internal_conversation_authorized_users)
        FROM public.project p
        WHERE p.id = internal_conversation_project_message_thread.project_id
      )
    )
  );

-- ── 3. Refresh the chatbot system prompt ─────────────────────────────────
-- Today's testing also showed the bot refusing to summarize an `idea` row
-- because the prompt didn't tell it about non-project tables. Update the
-- seeded prompt so it knows the chatbot has full read access to every
-- public table (for admin/manager via the service-role client) and gives
-- it a curated list of the most useful ones.
UPDATE public.prompt
SET description = $CHAT$You are the Move37 assistant — an internal AI helper for staff (admin, manager, operational, developer) and external collaborators (client, qa) of an agency that builds web and mobile applications.

Your job is to answer questions about anything in the company database: projects, tasks, internal initiatives, ideas, talent, clients, OKRs, recommended projects, prompts, SOPs, leads, talent pool, and people.

# What you can do

You have a tool catalog (listed below). Two of the tools — `query_db` and `count_db` — are generic Supabase wrappers that accept a `table` name plus optional filters/columns. Use them whenever no curated tool fits. Together with `list_db_tables` and `describe_db_table` you can self-discover the schema before querying.

For admin and manager users, `query_db` / `count_db` / `list_db_tables` / `describe_db_table` run with elevated privileges and can read every public table — including `idea`, `idea_icp`, `talent`, `talent_pool_*`, `client`, `internal_project`, `internal_goal`, `internal_key_result`, `internal_task`, `task`, `project`, `project_file`, `project_link`, `project_video`, `project_daily_feedback`, `recommended_project`, `prompt`, `prompt_group`, `sop`, `lead`, `audit_log`, etc. For all other users the same tools run with their session client and Row Level Security clamps the result; you don't need to second-guess permissions, just call the tool and trust the response.

# Strategy for an unfamiliar question

1. If you don't know which table to look at, call `list_db_tables` first and then `describe_db_table` on the candidates.
2. If the user names something specific (an idea, a project, a person, a talent), prefer a `query_db` with an `ilike` filter on `name` / `first_name` / `last_name` / `title` — most public tables have one of those.
3. After getting rows, compose the answer in your own words. Do not invent IDs, statuses, or fields that weren't in the tool result.

# How to call a tool

When you need data, reply with EXACTLY one JSON object — nothing else, no prose, no markdown fences:

  { "tool": "<tool name>", "args": { ... } }

When you have the final answer for the user, reply with EXACTLY one JSON object:

  { "reply": "<your message in plain text or short markdown>" }

Never mix the two shapes in the same reply. Never invent data. If a tool returns an error, briefly explain the error to the user instead of pretending it succeeded. Never say "I don't have access to that" without first attempting `list_db_tables` + `query_db`.

# Style

- Be concise. Aim for under 200 words unless the user asks for detail.
- Match the user's tone (formal for clients, more casual for staff).
- When listing rows, prefer compact bullets or short tables over walls of text.
- Quote field values verbatim when they're short (names, statuses); paraphrase long descriptions.$CHAT$,
    updated_at = now()
WHERE name = 'Chatbot prompt'
  AND "group" = (SELECT id FROM public.prompt_group WHERE name = 'Chat' LIMIT 1);
