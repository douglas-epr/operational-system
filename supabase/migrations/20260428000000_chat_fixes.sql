-- Chat: bug-fix + UX rework migration (2026-04-28)
-- Fixes shipped here (paired with the UI changes in the same dated PR):
--   1. Realtime publication: enable Postgres logical-replication on all
--      message + thread tables so `useRealtimeMessages` actually receives
--      INSERT events (this was the root cause of "sent message disappears").
--   2. Trigger fix: `fill_project_conversation_users` was firing on
--      INSERT *and* UPDATE OF authorized_users, clobbering manual edits
--      to the *_conversation_authorized_users arrays. Make it INSERT-only
--      so admin-managed membership survives subsequent updates.
--   3. Chatbot prompt: seed a `prompt_group { name='Chat' }` row plus a
--      `prompt { name='Chatbot prompt' }` row containing the system text
--      (loaded by run.ts at chat-turn time). Note: prompt_group.step was
--      dropped in 20260327100000, so we don't reference it here.

-- ── 1. Realtime publication ──────────────────────────────────────────────
-- Each ALTER PUBLICATION ... ADD TABLE will fail if the table is already
-- in the publication, so guard each one with a NOT EXISTS check against
-- pg_publication_tables.
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
    'private_conversation_message_thread',
    'private_chatbot_message'
  ];
BEGIN
  FOREACH t IN ARRAY msg_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ── 2. project_fill_conversation_users — INSERT-only ─────────────────────
-- Previously: BEFORE INSERT OR UPDATE OF authorized_users — every time
-- `authorized_users` was edited, the function rebuilt both
-- *_conversation_authorized_users arrays from scratch, wiping any add /
-- remove that admins/managers had performed via the new ConversationMembersModal.
-- Now: only fire on INSERT. After the project exists, conversation
-- membership is admin-managed via the chat actions.
DROP TRIGGER IF EXISTS project_fill_conversation_users ON public.project;
CREATE TRIGGER project_fill_conversation_users
  BEFORE INSERT ON public.project
  FOR EACH ROW EXECUTE FUNCTION public.fill_project_conversation_users();

-- ── 3. Chatbot prompt seed ───────────────────────────────────────────────
-- Idempotent insert of the new prompt_group ("Chat") and prompt
-- ("Chatbot prompt"). run.ts loads it via:
--   SELECT p.description
--   FROM prompt p JOIN prompt_group g ON g."id" = p."group"
--   WHERE g.name = 'Chat' AND p.name = 'Chatbot prompt' LIMIT 1;
-- If absent, run.ts falls back to its hardcoded SYSTEM_PROMPT_HEADER.

INSERT INTO public.prompt_group (name)
SELECT 'Chat'
WHERE NOT EXISTS (SELECT 1 FROM public.prompt_group WHERE name = 'Chat');

INSERT INTO public.prompt ("group", name, description)
SELECT
  (SELECT id FROM public.prompt_group WHERE name = 'Chat' LIMIT 1),
  'Chatbot prompt',
  $CHAT$You are the Blur Studio assistant — an internal AI helper for staff (admin, manager, operational, developer) and external collaborators (client, qa) of an agency that builds web and mobile applications.

Your job is to answer questions about projects, tasks, internal initiatives, ideas, talent, and people, by calling tools that hit the Supabase database.

# What you can do

You have a tool catalog (listed below). Two of the tools — `query_db` and `count_db` — are generic Supabase wrappers that accept a `table` name plus filters/columns. Use them when no curated tool fits.

For admin and manager users, `query_db`/`count_db` run with elevated privileges and can read every public table. For all other users, the same tools run with their session client and Row Level Security clamps the result to what they're allowed to see — so you don't need to second-guess permissions; just call the tool and trust the response.

# How to call a tool

When you need data, reply with EXACTLY one JSON object — nothing else, no prose, no markdown fences:

  { "tool": "<tool name>", "args": { ... } }

When you have the final answer for the user, reply with EXACTLY one JSON object:

  { "reply": "<your message in plain text or short markdown>" }

Never mix the two shapes in the same reply. Never invent data. If a tool returns an error, briefly explain the error to the user instead of pretending it succeeded.

# Style

- Be concise. Aim for under 200 words unless the user asks for detail.
- Match the user's tone (formal for clients, more casual for staff).
- When listing rows, prefer compact tables or bullets over walls of text.
- If the user asks something you genuinely can't answer with the available tools, say so.$CHAT$
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompt p
  JOIN public.prompt_group g ON g.id = p."group"
  WHERE g.name = 'Chat' AND p.name = 'Chatbot prompt'
);
