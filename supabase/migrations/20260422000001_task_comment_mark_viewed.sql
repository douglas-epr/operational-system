-- Adds a SECURITY DEFINER helper so any authenticated reader of a task's
-- comments can record that they've seen them (the RLS UPDATE policy on
-- task_comment only allows the comment owner / admin / manager).
--
-- The function appends auth.uid() into task_comment.viewed_by for every
-- comment on the given task that (a) was not authored by the caller and
-- (b) does not already list them in viewed_by.

CREATE OR REPLACE FUNCTION public.mark_task_comments_viewed(p_task_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.task_comment
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE task_id = p_task_id
     AND owner_id <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;

REVOKE ALL ON FUNCTION public.mark_task_comments_viewed(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_task_comments_viewed(uuid) TO authenticated;
