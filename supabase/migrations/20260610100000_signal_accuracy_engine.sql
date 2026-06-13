-- Signal Accuracy Engine (docs/marketing/signal-accuracy-report.md)
-- Decision contracts, structured quizzes, signal quality columns,
-- paid-traffic campaigns, interview intelligence, decision log.
-- Applied to hosted DB 2026-06-10 via MCP; this file documents and replays it.

-- 1. mkt_validation: decision contract + booking link
ALTER TABLE public.mkt_validation
  ADD COLUMN IF NOT EXISTS decision_contract jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_url text;

-- 2. mkt_landing: structured quiz schema + post-capture survey
ALTER TABLE public.mkt_landing
  ADD COLUMN IF NOT EXISTS quiz_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS survey_url text;

-- 3. mkt_signal: verification, survey answers, ICP fit
ALTER TABLE public.mkt_signal
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS survey_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS icp_fit boolean;

-- 4. mkt_prospect: ICP segment tag
ALTER TABLE public.mkt_prospect
  ADD COLUMN IF NOT EXISTS segment text;

-- 5. mkt_outreach: AI reply classification (filled by future webhook/manual)
ALTER TABLE public.mkt_outreach
  ADD COLUMN IF NOT EXISTS reply_sentiment text
  CHECK (reply_sentiment IN ('positive','neutral','negative','meeting_request') OR reply_sentiment IS NULL);

-- 6. Paid-traffic campaigns (manual spend v1; attribution via utm_campaign)
CREATE TABLE IF NOT EXISTS public.mkt_ad_campaign (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  landing_id      uuid REFERENCES public.mkt_landing(id) ON DELETE SET NULL,
  platform        text NOT NULL CHECK (platform IN ('meta','google','linkedin')),
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','paused','ended')),
  budget_cents    int NOT NULL DEFAULT 0,
  spend_cents     int NOT NULL DEFAULT 0,
  targeting_notes text,
  utm_campaign    text NOT NULL UNIQUE,
  ad_creative     jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at      timestamptz,
  ended_at        timestamptz,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_ad_campaign_idea_idx ON public.mkt_ad_campaign(idea_id);

-- 7. Interview intelligence
CREATE TABLE IF NOT EXISTS public.mkt_interview (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  prospect_id      uuid REFERENCES public.mkt_prospect(id) ON DELETE SET NULL,
  participant_name text,
  participant_role text,
  segment          text,
  source           text NOT NULL DEFAULT 'network'
                   CHECK (source IN ('outreach','network','panel','inbound','booking')),
  conducted_at     timestamptz,
  recording_url    text,
  transcript       text,
  consent          boolean NOT NULL DEFAULT false,
  analysis         jsonb NOT NULL DEFAULT '{}'::jsonb,
  analyzed_at      timestamptz,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_interview_idea_idx ON public.mkt_interview(idea_id);

-- 8. Decision log (status changes require rationale)
CREATE TABLE IF NOT EXISTS public.mkt_decision_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  verdict          public.mkt_validation_status NOT NULL,
  rationale        text NOT NULL,
  metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mkt_decision_log_idea_idx ON public.mkt_decision_log(idea_id);

-- 8b. Restore the research-cache upsert key lost in the idea_id migration
-- (was UNIQUE(project_id, source_key); needed by refreshResearchCache and
-- the interview-synthesis cache).
CREATE UNIQUE INDEX IF NOT EXISTS mkt_research_cache_idea_source_key
  ON public.mkt_research_cache (idea_id, source_key);

-- 9. RLS for the three new tables (same two-tier model as other mkt_* tables)
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['mkt_ad_campaign','mkt_interview','mkt_decision_log']) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s: admin/manager all" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "%s: admin/manager all" ON public.%I FOR ALL USING (public.is_admin_or_manager())',
      tbl, tbl
    );
    EXECUTE format('DROP POLICY IF EXISTS "%s: project member all" ON public.%I', tbl, tbl);
    EXECUTE format(
      $policy$
      CREATE POLICY "%s: project member all" ON public.%I FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.idea i
            JOIN public.project p ON p.id = i.project_id
            WHERE i.id = %I.idea_id
              AND auth.uid() = ANY(p.authorized_users)
          )
        )
      $policy$,
      tbl, tbl, tbl
    );
  END LOOP;
END $$;
