-- 2026-04-24 — Align Docs RLS policies to the new privacy-rules spec.
--
-- Summary of the new contract (admin/manager already have ALL on every table):
--   • project_playbook_version      : project members SELECT (via project.authorized_users)
--   • project_agreement_version     : user in agreement.authorized_users SELECT
--                                     user in agreement.required_signers UPDATE (for signing)
--   • project_file / link / video /
--     daily_feedback                : drop "authorized user insert" — only admin/manager create
--   • project_invoice               : drop project-wide SELECT; only the creator sees their own

------------------------------------------------------------------------------
-- 1. project_playbook_version: SELECT via project.authorized_users
------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_playbook_version: authorized user read"
  ON public.project_playbook_version;

CREATE POLICY "project_playbook_version: project member read"
  ON public.project_playbook_version FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

------------------------------------------------------------------------------
-- 2. project_agreement_version: drop client-type gate; add signer UPDATE
------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_agreement_version: client read"
  ON public.project_agreement_version;

CREATE POLICY "project_agreement_version: authorized user read"
  ON public.project_agreement_version FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- `signAgreement` performs a direct UPDATE to append the signature block
-- into `content` after the RPC writes signed_by. Let a required signer do that.
CREATE POLICY "project_agreement_version: signer update"
  ON public.project_agreement_version FOR UPDATE
  USING (auth.uid() = ANY(required_signers))
  WITH CHECK (auth.uid() = ANY(required_signers));

------------------------------------------------------------------------------
-- 3. Drop "authorized user insert" on file/link/video/daily_feedback.
--    Only admin/manager can create (spec says "admins, managers, and creator",
--    but at insert time only admin/manager can be that creator).
------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_file: authorized user insert"
  ON public.project_file;
DROP POLICY IF EXISTS "project_link: authorized user insert"
  ON public.project_link;
DROP POLICY IF EXISTS "project_video: authorized user insert"
  ON public.project_video;
DROP POLICY IF EXISTS "project_daily_feedback: authorized user insert"
  ON public.project_daily_feedback;

------------------------------------------------------------------------------
-- 4. project_invoice: creator-only visibility (admin/manager already have ALL)
------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_invoice: authorized user read"
  ON public.project_invoice;
DROP POLICY IF EXISTS "project_invoice: authorized user insert"
  ON public.project_invoice;

CREATE POLICY "project_invoice: creator read"
  ON public.project_invoice FOR SELECT
  USING (created_by = auth.uid());
