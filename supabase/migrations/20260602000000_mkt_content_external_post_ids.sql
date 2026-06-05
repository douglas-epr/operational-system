-- Marketing Validation Engine: make the social-post id map provider-agnostic.
-- We switched the social provider from Ayrshare to Postiz; the column stores a
-- channel -> external post id map regardless of provider, so rename it.
-- Guarded so it's safe to re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mkt_content'
      AND column_name = 'ayrshare_post_ids'
  ) THEN
    ALTER TABLE public.mkt_content RENAME COLUMN ayrshare_post_ids TO external_post_ids;
  END IF;
END $$;
