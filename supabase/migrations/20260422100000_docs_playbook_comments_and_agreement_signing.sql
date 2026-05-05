-- Docs page: playbook anchored comments + agreement sign flow + signature UX.
--
-- Adapted to the current remote schema where:
--   • agreement_template (not project_agreement_template) already has
--     id, name, content, created_by, created_at, updated_at
--   • project_agreement_version.type is a uuid FK to agreement_template.id
--     (so "type" effectively IS the template reference). We relax NOT NULL.
--   • Neither playbook nor agreement versions currently have
--     google_docs_url or authorized_users — both are added here.
--   • profiles has no signature column yet — added here.

-- ────────────────────────────────────────────────────────────────
-- 1. Column additions
-- ────────────────────────────────────────────────────────────────

-- project_agreement_version ---------------------------------------
ALTER TABLE public.project_agreement_version
  ADD COLUMN IF NOT EXISTS signed_by        UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS required_signers UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS authorized_users UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS google_docs_url  TEXT;

-- Allow versions without a template (user: "can be connected with an
-- agreement_template or not").
ALTER TABLE public.project_agreement_version
  ALTER COLUMN type DROP NOT NULL;

-- project_playbook_version ----------------------------------------
ALTER TABLE public.project_playbook_version
  ADD COLUMN IF NOT EXISTS google_docs_url TEXT;

-- profiles --------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signature TEXT;


-- ────────────────────────────────────────────────────────────────
-- 2. New tables: playbook comments + replies
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_playbook_comment (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.project(id)                  ON DELETE CASCADE,
  playbook_id UUID        NOT NULL REFERENCES public.project_playbook_version(id) ON DELETE CASCADE,
  message     TEXT,
  attachments JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_by  UUID        NOT NULL REFERENCES public.profiles(id)                 ON DELETE CASCADE,
  viewed_by   UUID[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_playbook_comment_reply (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  UUID        NOT NULL REFERENCES public.project(id)                    ON DELETE CASCADE,
  playbook_id                 UUID        NOT NULL REFERENCES public.project_playbook_version(id)   ON DELETE CASCADE,
  project_playbook_comment_id UUID        NOT NULL REFERENCES public.project_playbook_comment(id)   ON DELETE CASCADE,
  message                     TEXT,
  attachments                 JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_by                  UUID        NOT NULL REFERENCES public.profiles(id)                   ON DELETE CASCADE,
  viewed_by                   UUID[]      NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_playbook_comment_playbook
  ON public.project_playbook_comment(playbook_id);

CREATE INDEX IF NOT EXISTS idx_project_playbook_comment_reply_comment
  ON public.project_playbook_comment_reply(project_playbook_comment_id);


-- ────────────────────────────────────────────────────────────────
-- 3. RLS on new tables
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.project_playbook_comment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_playbook_comment_reply ENABLE ROW LEVEL SECURITY;

-- project_playbook_comment ----------------------------------------

DROP POLICY IF EXISTS "project_playbook_comment: admin/manager all"       ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: authorized user read"   ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: authorized user insert" ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: owner update"           ON public.project_playbook_comment;
DROP POLICY IF EXISTS "project_playbook_comment: owner delete"           ON public.project_playbook_comment;

CREATE POLICY "project_playbook_comment: admin/manager all"
  ON public.project_playbook_comment FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_playbook_comment: authorized user read"
  ON public.project_playbook_comment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_playbook_comment: authorized user insert"
  ON public.project_playbook_comment FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_playbook_comment: owner update"
  ON public.project_playbook_comment FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_playbook_comment: owner delete"
  ON public.project_playbook_comment FOR DELETE
  USING (created_by = auth.uid());

-- project_playbook_comment_reply ----------------------------------

DROP POLICY IF EXISTS "project_playbook_comment_reply: admin/manager all"       ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: authorized user read"    ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: authorized user insert"  ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: owner update"            ON public.project_playbook_comment_reply;
DROP POLICY IF EXISTS "project_playbook_comment_reply: owner delete"            ON public.project_playbook_comment_reply;

CREATE POLICY "project_playbook_comment_reply: admin/manager all"
  ON public.project_playbook_comment_reply FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_playbook_comment_reply: authorized user read"
  ON public.project_playbook_comment_reply FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_playbook_comment_reply: authorized user insert"
  ON public.project_playbook_comment_reply FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project p
       WHERE p.id = project_id
         AND auth.uid() = ANY(p.authorized_users)
    )
  );

CREATE POLICY "project_playbook_comment_reply: owner update"
  ON public.project_playbook_comment_reply FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "project_playbook_comment_reply: owner delete"
  ON public.project_playbook_comment_reply FOR DELETE
  USING (created_by = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 4. Storage buckets
-- ────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-playbook-attachments', 'project-playbook-attachments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-signatures', 'user-signatures', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "project-playbook-attachments public read"  ON storage.objects;
DROP POLICY IF EXISTS "project-playbook-attachments auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "project-playbook-attachments owner update" ON storage.objects;
DROP POLICY IF EXISTS "project-playbook-attachments owner delete" ON storage.objects;

CREATE POLICY "project-playbook-attachments public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-playbook-attachments');

CREATE POLICY "project-playbook-attachments auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-playbook-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "project-playbook-attachments owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-playbook-attachments' AND owner = auth.uid());

CREATE POLICY "project-playbook-attachments owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-playbook-attachments' AND owner = auth.uid());

DROP POLICY IF EXISTS "user-signatures public read"  ON storage.objects;
DROP POLICY IF EXISTS "user-signatures auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "user-signatures owner update" ON storage.objects;
DROP POLICY IF EXISTS "user-signatures owner delete" ON storage.objects;

CREATE POLICY "user-signatures public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-signatures');

CREATE POLICY "user-signatures auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-signatures' AND auth.role() = 'authenticated');

CREATE POLICY "user-signatures owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-signatures' AND owner = auth.uid());

CREATE POLICY "user-signatures owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-signatures' AND owner = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 5. SECURITY DEFINER helpers
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_playbook_comments_viewed(p_playbook_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.project_playbook_comment
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE playbook_id = p_playbook_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;

REVOKE ALL ON FUNCTION public.mark_playbook_comments_viewed(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_playbook_comments_viewed(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.mark_playbook_comment_replies_viewed(p_comment_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.project_playbook_comment_reply
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_playbook_comment_id = p_comment_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;

REVOKE ALL ON FUNCTION public.mark_playbook_comment_replies_viewed(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_playbook_comment_replies_viewed(uuid) TO authenticated;


-- sign_agreement:
--   • Caller must be in authorized_users of the agreement OR in
--     project.authorized_users.
--   • Agreement status must be 'ready_to_sign'.
--   • auth.uid() is appended to signed_by (no-op if already present).
--   • If required_signers is non-empty AND every required signer is in
--     signed_by, status flips to 'completed'.
-- Returns (signed_by, status).
CREATE OR REPLACE FUNCTION public.sign_agreement(p_agreement_id uuid)
RETURNS TABLE(signed_by uuid[], status public.os_agreement_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_authorized_users UUID[];
  v_project_users    UUID[];
  v_required_signers UUID[];
  v_signed_by        UUID[];
  v_status           public.os_agreement_status;
  v_uid              UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT pav.authorized_users, pav.required_signers, pav.signed_by, pav.status,
         p.authorized_users
    INTO v_authorized_users, v_required_signers, v_signed_by, v_status,
         v_project_users
    FROM public.project_agreement_version pav
    LEFT JOIN public.project p ON p.id = pav.project_id
   WHERE pav.id = p_agreement_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Agreement not found';
  END IF;

  IF NOT (v_uid = ANY(v_authorized_users))
     AND NOT (v_uid = ANY(v_project_users)) THEN
    RAISE EXCEPTION 'Not authorized to sign this agreement';
  END IF;

  IF v_status <> 'ready_to_sign' THEN
    RAISE EXCEPTION 'Agreement is not ready to be signed (current status: %)', v_status;
  END IF;

  IF NOT (v_uid = ANY(v_signed_by)) THEN
    v_signed_by := array_append(v_signed_by, v_uid);
  END IF;

  IF array_length(v_required_signers, 1) IS NOT NULL
     AND v_required_signers <@ v_signed_by THEN
    v_status := 'completed';
  END IF;

  UPDATE public.project_agreement_version pav
     SET signed_by  = v_signed_by,
         status     = v_status,
         updated_at = NOW()
   WHERE pav.id = p_agreement_id;

  RETURN QUERY SELECT v_signed_by, v_status;
END
$$;

REVOKE ALL ON FUNCTION public.sign_agreement(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.sign_agreement(uuid) TO authenticated;
