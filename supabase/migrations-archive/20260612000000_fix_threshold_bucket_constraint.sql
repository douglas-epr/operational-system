-- Migration: Update idea_report.threshold_bucket check constraint
-- Old values: "ready" | "refine" | "risk"  (original single-shot report prompt)
-- New values: "build" | "refine" | "kill"   (devil's advocate debate protocol)
-- Keep "ready" and "risk" in the constraint so existing rows are not invalidated.

ALTER TABLE public.idea_report
  DROP CONSTRAINT IF EXISTS idea_report_threshold_bucket_check;

ALTER TABLE public.idea_report
  ADD CONSTRAINT idea_report_threshold_bucket_check
    CHECK (threshold_bucket IN ('build', 'refine', 'kill', 'ready', 'risk'));

NOTIFY pgrst, 'reload schema';
