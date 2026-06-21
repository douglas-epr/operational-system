-- SECURITY (CRITICAL): block privilege escalation via profiles self-update,
-- and harden the one SECURITY DEFINER helper missing a pinned search_path.
--
-- The baseline policy `profiles: update own` is `FOR UPDATE USING (id = auth.uid())`
-- with NO `WITH CHECK`. In Postgres RLS, an UPDATE policy with only USING reuses
-- that expression as the post-update check — so the sole constraint is that the
-- row's id stays = auth.uid(). Combined with `GRANT ALL ON profiles TO authenticated`,
-- ANY logged-in user could `PATCH /rest/v1/profiles?id=eq.<self> { "type": "admin" }`
-- and self-promote to admin (full platform takeover via get_user_type()/RLS/page-gate).
--
-- Legitimate role changes happen ONLY through src/app/users/actions.ts, which uses
-- the SERVICE-ROLE client. The guard below therefore allows the `service_role`
-- (and any authenticated admin/manager, defense-in-depth) while blocking everyone
-- else from changing `profiles.type`.

CREATE OR REPLACE FUNCTION public.profiles_guard_type_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  -- Allow the change only when it comes from a trusted backend context
  -- (service-role client → no end-user JWT → auth.uid() IS NULL, e.g. the
  -- admin-gated users/actions.ts) or from an authenticated admin/manager.
  -- We deliberately avoid the deprecated auth.role() here (it is brittle once
  -- anonymous sign-ins are enabled). A regular authenticated user always has a
  -- non-null auth.uid() and is therefore blocked from editing their own type.
  IF NEW.type IS DISTINCT FROM OLD.type
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin_or_manager() THEN
    RAISE EXCEPTION 'Not authorized to change profile type';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_type_change ON public.profiles;
CREATE TRIGGER profiles_guard_type_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_type_change();

-- Defense-in-depth: add an explicit WITH CHECK so the row identity cannot be
-- swapped on update (USING-only policies are a recurring Supabase footgun).
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Harden the only SECURITY DEFINER helper missing a pinned search_path
-- (search_path-injection hazard; flagged by the Supabase linter as
-- 0011_function_search_path_mutable).
CREATE OR REPLACE FUNCTION public.is_staff_role()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT public.get_user_type() = ANY (
    ARRAY['admin','manager','operational']::public.os_user_type[]
  )
$$;

NOTIFY pgrst, 'reload schema';
