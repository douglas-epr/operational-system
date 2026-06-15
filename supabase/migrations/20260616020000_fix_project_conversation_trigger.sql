-- Fix fill_project_conversation_users trigger function.
-- internal_conversation_authorized_users was dropped in 20260615000000 but
-- the function still tried to write to it, causing INSERT on project to fail.
CREATE OR REPLACE FUNCTION public.fill_project_conversation_users()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.external_conversation_authorized_users := COALESCE(
    (SELECT array_agg(p.id) FROM profiles p
      WHERE p.id = ANY(NEW.authorized_users)
        AND p.type IN ('admin','manager','operational','developer','client')),
    '{}'::UUID[]);
  RETURN NEW;
END $function$;
