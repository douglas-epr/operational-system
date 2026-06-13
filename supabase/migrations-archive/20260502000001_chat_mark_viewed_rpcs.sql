-- Chat: mark-viewed RPC functions
--
-- The chat actions in src/app/chat/actions.ts already call these 8 RPC
-- names via supabase.rpc(...). They were never created in any earlier
-- migration, so every invocation has been silently failing with
-- "function does not exist" — the user's `viewed_by` array never
-- received their UUID and the unread count never decreased.
--
-- Each function appends auth.uid() to the relevant viewed_by[] arrays
-- under SECURITY DEFINER (the RLS UPDATE policies on these tables only
-- permit the message author / admin / manager to update arbitrary rows,
-- but everyone with read access should be able to record that they saw
-- a message). The functions are idempotent — they only update rows
-- where the caller is not the author and not already in viewed_by.

-- ── Top-level conversation messages (touches both message + thread tables) ──

CREATE OR REPLACE FUNCTION public.mark_external_project_messages_viewed(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_project_external_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_project_external_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_internal_project_messages_viewed(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_project_internal_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_project_internal_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_conversation_internal_project_messages_viewed(p_internal_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_internal_project_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE internal_project_id = p_internal_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_internal_project_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE internal_project_id = p_internal_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_private_conversation_messages_viewed(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_private_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE conversation_id = p_conversation_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_private_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE conversation_id = p_conversation_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

-- ── Single-thread (called by ThreadPanel when user opens a thread) ──────────

CREATE OR REPLACE FUNCTION public.mark_external_project_thread_viewed(p_parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_project_external_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_internal_project_thread_viewed(p_parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_project_internal_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_conversation_internal_project_thread_viewed(p_parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_internal_project_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_private_conversation_thread_viewed(p_parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_private_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;

-- ── Permissions ─────────────────────────────────────────────────────────────

DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'mark_external_project_messages_viewed(uuid)',
    'mark_internal_project_messages_viewed(uuid)',
    'mark_conversation_internal_project_messages_viewed(uuid)',
    'mark_private_conversation_messages_viewed(uuid)',
    'mark_external_project_thread_viewed(uuid)',
    'mark_internal_project_thread_viewed(uuid)',
    'mark_conversation_internal_project_thread_viewed(uuid)',
    'mark_private_conversation_thread_viewed(uuid)'
  ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM public', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END$$;
