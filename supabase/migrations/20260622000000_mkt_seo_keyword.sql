-- SEO keyword rank tracker for the Market Validation flow.
-- Stores tracked keywords per idea and their Google rank history.

CREATE TABLE public.mkt_seo_keyword (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  keyword          text NOT NULL,
  target_domain    text,
  last_rank        int,
  last_url         text,
  last_checked_at  timestamptz,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, keyword)
);

CREATE TABLE public.mkt_seo_rank_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id  uuid NOT NULL REFERENCES public.mkt_seo_keyword(id) ON DELETE CASCADE,
  rank        int,
  url         text,
  checked_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.mkt_seo_keyword ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mkt_seo_keyword: admin/manager all"
  ON public.mkt_seo_keyword
  USING (public.is_admin_or_manager());

CREATE POLICY "mkt_seo_keyword: project member all"
  ON public.mkt_seo_keyword
  USING (EXISTS (
    SELECT 1
    FROM public.idea i
    JOIN public.project p ON p.id = i.project_id
    WHERE i.id = mkt_seo_keyword.idea_id
      AND auth.uid() = ANY(p.authorized_users)
  ));

ALTER TABLE public.mkt_seo_rank_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mkt_seo_rank_history: admin/manager all"
  ON public.mkt_seo_rank_history
  USING (public.is_admin_or_manager());

CREATE POLICY "mkt_seo_rank_history: project member all"
  ON public.mkt_seo_rank_history
  USING (EXISTS (
    SELECT 1
    FROM public.mkt_seo_keyword k
    JOIN public.idea i ON i.id = k.idea_id
    JOIN public.project p ON p.id = i.project_id
    WHERE k.id = mkt_seo_rank_history.keyword_id
      AND auth.uid() = ANY(p.authorized_users)
  ));

-- ── Grants ────────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE public.mkt_seo_keyword TO anon;
GRANT ALL ON TABLE public.mkt_seo_keyword TO authenticated;
GRANT ALL ON TABLE public.mkt_seo_keyword TO service_role;

GRANT ALL ON TABLE public.mkt_seo_rank_history TO anon;
GRANT ALL ON TABLE public.mkt_seo_rank_history TO authenticated;
GRANT ALL ON TABLE public.mkt_seo_rank_history TO service_role;
