-- Talent Pool: share-link self-edit + widen RLS to include 'operational' staff.
--
-- Why:
--   * The /talent-pool page is restricted to admin/manager/operational
--     (paginas.md), but the existing initial-schema RLS only granted
--     admin/manager. Add an additive "staff all" policy across the
--     talent / company / client surface.
--   * Allow a manager to issue a 4-hour share link so a talent can
--     self-edit their profile without authenticating.
--     Mechanism: re-use the existing talent.code (TEXT UNIQUE, currently
--     unused) as the share token, plus a new code_expires_at column.
--     Two SECURITY DEFINER RPCs (get_talent_by_code / update_talent_by_code)
--     are the only public-callable surface; they validate expiry inside
--     the function so anon / authenticated callers cannot read or modify
--     anything else.
--   * New storage bucket 'talent-avatars' (public read; staff write).

-- 1. Share-link expiry + updated_at on talent
ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.talent_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS talent_updated_at ON public.talent;
CREATE TRIGGER talent_updated_at
  BEFORE UPDATE ON public.talent
  FOR EACH ROW EXECUTE FUNCTION public.talent_set_updated_at();

CREATE INDEX IF NOT EXISTS talent_code_active_idx
  ON public.talent (code)
  WHERE code IS NOT NULL AND code_expires_at IS NOT NULL;

-- 2. Widen RLS on talent + related tables to include 'operational' (additive).
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'talent', 'talent_tool', 'talent_programming_language',
    'talent_referred_by', 'client_who_referred_this_talent',
    'company', 'client'
  ]
  LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS "%1$s: staff all" ON public.%1$I;
      CREATE POLICY "%1$s: staff all" ON public.%1$I
        FOR ALL TO authenticated
        USING      (public.get_user_type() IN ('admin','manager','operational'))
        WITH CHECK (public.get_user_type() IN ('admin','manager','operational'));
    $f$, t);
  END LOOP;
END $$;

-- 3. Public RPC: read talent by share code
CREATE OR REPLACE FUNCTION public.get_talent_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row JSONB;
BEGIN
  SELECT to_jsonb(t) || jsonb_build_object(
      'tools',                  COALESCE((SELECT jsonb_agg(jsonb_build_object('tool', tool, 'score', score)) FROM talent_tool WHERE talent_id = t.id), '[]'::jsonb),
      'programming_languages',  COALESCE((SELECT jsonb_agg(jsonb_build_object('language', programming_language, 'score', score)) FROM talent_programming_language WHERE talent_id = t.id), '[]'::jsonb),
      'recommender_ids',        COALESCE((SELECT jsonb_agg(referred_by_id) FROM talent_referred_by WHERE talent_id = t.id AND referred_by_id IS NOT NULL), '[]'::jsonb),
      'client_referrer_ids',    COALESCE((SELECT jsonb_agg(client_id) FROM client_who_referred_this_talent WHERE talent_id = t.id AND client_id IS NOT NULL), '[]'::jsonb),
      'current_company',        (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'website', c.website) FROM company c WHERE c.id = t.current_company_id)
    )
  INTO v_row
  FROM talent t
  WHERE t.code = p_code AND t.code_expires_at IS NOT NULL AND t.code_expires_at > NOW();
  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.get_talent_by_code(TEXT) TO anon, authenticated;

-- 4. Public RPC: update talent by share code
CREATE OR REPLACE FUNCTION public.update_talent_by_code(p_code TEXT, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM talent
   WHERE code = p_code AND code_expires_at IS NOT NULL AND code_expires_at > NOW();
  IF v_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Link is invalid or has expired.');
  END IF;

  UPDATE talent SET
    name                 = COALESCE(p_payload->>'name',                 name),
    email                = COALESCE(p_payload->>'email',                email),
    phone                = COALESCE(p_payload->>'phone',                phone),
    linkedin             = COALESCE(p_payload->>'linkedin',             linkedin),
    portfolio            = COALESCE(p_payload->>'portfolio',            portfolio),
    picture              = COALESCE(p_payload->>'picture',              picture),
    country              = COALESCE(p_payload->>'country',              country),
    current_job_position = COALESCE(p_payload->>'current_job_position', current_job_position),
    level                = COALESCE((p_payload->>'level')::os_talent_level, level),
    authority_level      = COALESCE((p_payload->>'authority_level')::os_talent_authority_level, authority_level),
    current_company_id   = COALESCE((p_payload->>'current_company_id')::UUID, current_company_id)
  WHERE id = v_id;

  IF p_payload ? 'tools' THEN
    DELETE FROM talent_tool WHERE talent_id = v_id;
    INSERT INTO talent_tool (talent_id, tool, score)
    SELECT v_id, (x->>'tool')::os_tool, NULLIF(x->>'score','')::INT
      FROM jsonb_array_elements(p_payload->'tools') x;
  END IF;

  IF p_payload ? 'programming_languages' THEN
    DELETE FROM talent_programming_language WHERE talent_id = v_id;
    INSERT INTO talent_programming_language (talent_id, programming_language, score)
    SELECT v_id, (x->>'language')::os_programming_language, NULLIF(x->>'score','')::INT
      FROM jsonb_array_elements(p_payload->'programming_languages') x;
  END IF;

  RETURN jsonb_build_object('id', v_id);
END $$;

GRANT EXECUTE ON FUNCTION public.update_talent_by_code(TEXT, JSONB) TO anon, authenticated;

-- 5. Storage bucket for talent avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-avatars', 'talent-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "talent-avatars staff write" ON storage.objects;
CREATE POLICY "talent-avatars staff write" ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'talent-avatars' AND public.get_user_type() IN ('admin','manager','operational'))
  WITH CHECK (bucket_id = 'talent-avatars' AND public.get_user_type() IN ('admin','manager','operational'));

DROP POLICY IF EXISTS "talent-avatars public read" ON storage.objects;
CREATE POLICY "talent-avatars public read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'talent-avatars');
