-- Chat: fourth-pass fixes (2026-04-28).
--
-- The previous migration (20260428100000) tried to add owner_id → profiles
-- FKs but its `IF NOT EXISTS` guard matched constraints that already existed
-- (the original chat schema migration had created `*_owner_id_fkey`
-- constraints pointing to `auth.users(id)` rather than `profiles(id)`).
-- Result: PostgREST still can't embed `profiles:profiles!owner_id(...)`
-- because no FK targets profiles, and every sendMessage / replyInThread
-- call returns an error. The toasts said something like
-- "Could not find a relationship between 'X' and 'profiles'".
--
-- Repoint each `*_owner_id_fkey` from `auth.users(id)` to `public.profiles(id)`.
-- profiles.id itself is FK'd to auth.users.id (1:1), so no integrity is
-- lost.
--
-- Also: group private conversations.  `createPrivateConversation(peerUserId)`
-- and `UserPickerModal` only support 1:1 chats today.  Add an optional
-- `title` column to `private_conversation` so groups can have a name, and
-- patch the actions/UI in code.

-- ── 1. Repoint *_owner_id_fkey to profiles ───────────────────────────────
DO $$
DECLARE
  t TEXT;
  fk_name TEXT;
  msg_tables TEXT[] := ARRAY[
    'external_conversation_project_message',
    'external_conversation_project_message_thread',
    'internal_conversation_project_message',
    'internal_conversation_project_message_thread',
    'conversation_internal_project_message',
    'conversation_internal_project_message_thread',
    'private_conversation_message',
    'private_conversation_message_thread'
  ];
BEGIN
  FOREACH t IN ARRAY msg_tables LOOP
    fk_name := t || '_owner_id_fkey';
    -- Drop if it exists (any target).
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      t, fk_name
    );
    -- Re-add pointing to profiles.id.
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I
         FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE',
      t, fk_name
    );
  END LOOP;
END $$;

-- ── 2. Group private conversations: add optional title column ────────────
ALTER TABLE public.private_conversation
  ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN public.private_conversation.title IS
  'Optional human-readable title — used for groups (3+ participants). '
  'Null for 1:1 DMs (UI shows the peer''s name instead).';

-- Tell PostgREST about the new column + FKs.
NOTIFY pgrst, 'reload schema';
