-- Marketing Validation Engine (mkt_*)
-- A generic, project-agnostic demand-validation pipeline:
--   Source -> Outreach -> Content -> Capture -> Measure
-- NOT a Bubble replication — this is a new first-class domain (see docs/marketing/).
--
-- Design rules honored:
--   • RLS on every table (CLAUDE.md #2): admin/manager full + project-member full.
--   • Every table FK'd to public.project(id) ON DELETE CASCADE (incl. child tables).
--   • Option sets -> enums (CLAUDE.md #5).
--   • Append-only migration (CLAUDE.md #3).
--
-- Public capture/landing reads are performed server-side with the service-role
-- client, so NO anon RLS policies are exposed. RLS stays staff-only everywhere.

-- ── Enums ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.mkt_funnel_mode AS ENUM
    ('b2b_outreach','consumer_capture','hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_validation_status AS ENUM
    ('validating','killed','doubling_down');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_channel AS ENUM
    ('email','linkedin','google_maps','instagram','facebook','reddit','x');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_outreach_status AS ENUM
    ('queued','sent','opened','replied','bounced','unsub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_signal_type AS ENUM
    ('quiz','waitlist','preorder');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mkt_content_status AS ENUM
    ('draft','scheduled','posted','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────

-- Per-project funnel config (1:1 with project).
CREATE TABLE IF NOT EXISTS public.mkt_validation (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  funnel_mode             public.mkt_funnel_mode NOT NULL DEFAULT 'b2b_outreach',
  status                  public.mkt_validation_status NOT NULL DEFAULT 'validating',
  positioning             text,
  icp_definition          jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_capture_stages  text[] NOT NULL DEFAULT '{}',
  created_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Sourced contact (B2B).
CREATE TABLE IF NOT EXISTS public.mkt_prospect (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name          text,
  email         text,
  company       text,
  title         text,
  linkedin_url  text,
  source        text,
  enrichment    jsonb NOT NULL DEFAULT '{}'::jsonb,
  score         numeric,
  status        text NOT NULL DEFAULT 'new',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_prospect_project_idx ON public.mkt_prospect(project_id);
-- Dedupe within a project by email (only when email present).
CREATE UNIQUE INDEX IF NOT EXISTS mkt_prospect_project_email_uniq
  ON public.mkt_prospect(project_id, lower(email)) WHERE email IS NOT NULL;

-- A sourcing job (Apollo / Apify run).
CREATE TABLE IF NOT EXISTS public.mkt_source_run (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  channel            public.mkt_channel NOT NULL,
  query              jsonb NOT NULL DEFAULT '{}'::jsonb,
  status             text NOT NULL DEFAULT 'pending',
  result_count       int NOT NULL DEFAULT 0,
  apify_dataset_ref  text,
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_source_run_project_idx ON public.mkt_source_run(project_id);

-- Outreach campaign.
CREATE TABLE IF NOT EXISTS public.mkt_campaign (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  channel     public.mkt_channel NOT NULL DEFAULT 'email',
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'draft',
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_campaign_project_idx ON public.mkt_campaign(project_id);

-- Step within a campaign (project_id denormalized for uniform RLS).
CREATE TABLE IF NOT EXISTS public.mkt_sequence_step (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.mkt_campaign(id) ON DELETE CASCADE,
  step_order      int NOT NULL DEFAULT 0,
  delay_days      int NOT NULL DEFAULT 0,
  subject_tpl     text,
  body_tpl        text,
  ai_personalise  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_sequence_step_campaign_idx ON public.mkt_sequence_step(campaign_id, step_order);

-- Per-prospect message log.
CREATE TABLE IF NOT EXISTS public.mkt_outreach (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  prospect_id       uuid NOT NULL REFERENCES public.mkt_prospect(id) ON DELETE CASCADE,
  campaign_id       uuid NOT NULL REFERENCES public.mkt_campaign(id) ON DELETE CASCADE,
  step_order        int NOT NULL DEFAULT 0,
  status            public.mkt_outreach_status NOT NULL DEFAULT 'queued',
  scheduled_at      timestamptz,
  sent_at           timestamptz,
  opened_at         timestamptz,
  replied_at        timestamptz,
  brevo_message_id  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_outreach_project_idx ON public.mkt_outreach(project_id);
CREATE INDEX IF NOT EXISTS mkt_outreach_due_idx ON public.mkt_outreach(status, scheduled_at);

-- Content piece (multi-channel social).
CREATE TABLE IF NOT EXISTS public.mkt_content (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  channels           text[] NOT NULL DEFAULT '{}',
  body               text,
  media_url          text,
  status             public.mkt_content_status NOT NULL DEFAULT 'draft',
  scheduled_at       timestamptz,
  posted_at          timestamptz,
  ayrshare_post_ids  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_generated       boolean NOT NULL DEFAULT false,
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_content_project_idx ON public.mkt_content(project_id);
CREATE INDEX IF NOT EXISTS mkt_content_due_idx ON public.mkt_content(status, scheduled_at);

-- Landing page config (public slug).
CREATE TABLE IF NOT EXISTS public.mkt_landing (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  slug            text NOT NULL UNIQUE,
  title           text,
  hero            jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections        jsonb NOT NULL DEFAULT '[]'::jsonb,
  capture_stages  text[] NOT NULL DEFAULT '{}',
  stripe_price_id text,
  published       boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_landing_project_idx ON public.mkt_landing(project_id);

-- Captured demand signal (append-only; written server-side via service client).
CREATE TABLE IF NOT EXISTS public.mkt_signal (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  landing_id         uuid REFERENCES public.mkt_landing(id) ON DELETE SET NULL,
  type               public.mkt_signal_type NOT NULL,
  email              text,
  name               text,
  quiz_answers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  stripe_session_id  text,
  amount_cents       int,
  utm                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_signal_project_idx ON public.mkt_signal(project_id, type);

-- Analytics beacon (append-only).
CREATE TABLE IF NOT EXISTS public.mkt_event (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  landing_id  uuid REFERENCES public.mkt_landing(id) ON DELETE SET NULL,
  type        text NOT NULL,
  session_id  text,
  utm         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_event_project_idx ON public.mkt_event(project_id, type);

-- Unsubscribe / GDPR suppression (checked before every outbound send).
CREATE TABLE IF NOT EXISTS public.mkt_suppression (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  email       text NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS mkt_suppression_project_email_uniq
  ON public.mkt_suppression(project_id, lower(email));

-- ── updated_at triggers ─────────────────────────────────────────────────────────
CREATE TRIGGER set_updated_at_mkt_validation    BEFORE UPDATE ON public.mkt_validation    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_prospect      BEFORE UPDATE ON public.mkt_prospect      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_source_run    BEFORE UPDATE ON public.mkt_source_run    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_campaign      BEFORE UPDATE ON public.mkt_campaign      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_sequence_step BEFORE UPDATE ON public.mkt_sequence_step FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_outreach      BEFORE UPDATE ON public.mkt_outreach      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_content       BEFORE UPDATE ON public.mkt_content       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mkt_landing       BEFORE UPDATE ON public.mkt_landing       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.mkt_validation    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_prospect      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_source_run    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_campaign      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_sequence_step ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_outreach      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_content       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_landing       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_signal        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_event         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_suppression   ENABLE ROW LEVEL SECURITY;

-- Uniform policy per table: admin/manager full, OR staff member of the linked
-- project (auth.uid() in project.authorized_users). Service role bypasses RLS
-- for public capture/landing reads.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'mkt_validation','mkt_prospect','mkt_source_run','mkt_campaign',
    'mkt_sequence_step','mkt_outreach','mkt_content','mkt_landing',
    'mkt_signal','mkt_event','mkt_suppression'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ': admin/manager all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ': project member all', t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR ALL
        USING (public.is_admin_or_manager())
        WITH CHECK (public.is_admin_or_manager())
    $f$, t || ': admin/manager all', t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR ALL
        USING (EXISTS (SELECT 1 FROM public.project p
                       WHERE p.id = %I.project_id AND auth.uid() = ANY(p.authorized_users)))
        WITH CHECK (EXISTS (SELECT 1 FROM public.project p
                       WHERE p.id = %I.project_id AND auth.uid() = ANY(p.authorized_users)))
    $f$, t || ': project member all', t, t, t);
  END LOOP;
END $$;
