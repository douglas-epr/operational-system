-- Link prospects back to the sourcing run that produced them.
ALTER TABLE public.mkt_prospect
  ADD COLUMN IF NOT EXISTS source_run_id UUID REFERENCES public.mkt_source_run(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mkt_prospect_source_run_id_idx
  ON public.mkt_prospect(source_run_id) WHERE source_run_id IS NOT NULL;

-- Enforce unique emails per project (belt-and-suspenders on top of app-level dedup).
CREATE UNIQUE INDEX IF NOT EXISTS mkt_prospect_project_email_unique
  ON public.mkt_prospect(project_id, lower(email))
  WHERE email IS NOT NULL;
