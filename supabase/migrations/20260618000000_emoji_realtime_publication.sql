-- ── Enable Supabase Realtime for all emoji reaction tables ───────────────────
--
-- Two steps are required:
--   1. REPLICA IDENTITY FULL so that DELETE events include all column values
--      (not just the primary key). Without this, payload.old only has `id`
--      and the FK column (e.g. conversation_project_external_message_id) is
--      missing, making it impossible to know which message lost a reaction.
--   2. Add each table to the supabase_realtime publication. Supabase does NOT
--      publish tables automatically — they must be explicitly added.

ALTER TABLE public.conversation_project_external_message_emoji         REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_project_external_message_thread_emoji  REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_internal_project_message_emoji         REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_internal_project_message_thread_emoji  REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_private_message_emoji                  REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_private_message_thread_emoji           REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.conversation_project_external_message_emoji,
  public.conversation_project_external_message_thread_emoji,
  public.conversation_internal_project_message_emoji,
  public.conversation_internal_project_message_thread_emoji,
  public.conversation_private_message_emoji,
  public.conversation_private_message_thread_emoji;
