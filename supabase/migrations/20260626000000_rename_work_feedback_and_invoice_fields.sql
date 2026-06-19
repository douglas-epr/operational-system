-- Rename "daily feedback" → "work feedback" and add work-period fields.
-- Feedback is no longer daily: users now pick a Start/End date and log total
-- hours worked for that interval. Invoices gain the same work-period fields,
-- merge SWIFT/BIC + IBAN into a free-form "account details" field, and feed an
-- AI-fill flow that summarizes work feedback over a date range.
--
-- Append-only. Safe to re-run (IF EXISTS / IF NOT EXISTS guards).

-- ── 1. Rename the feedback tables ────────────────────────────────────────────
ALTER TABLE IF EXISTS public.project_daily_feedback
  RENAME TO project_work_feedback;

ALTER TABLE IF EXISTS public.internal_project_daily_feedback
  RENAME TO internal_project_work_feedback;

-- ── 2. New work-period columns on the feedback tables ────────────────────────
ALTER TABLE public.project_work_feedback
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date,
  ADD COLUMN IF NOT EXISTS total_time numeric;

ALTER TABLE public.internal_project_work_feedback
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date,
  ADD COLUMN IF NOT EXISTS total_time numeric;

-- ── 3. Keep RLS policy names consistent with the new table names ─────────────
ALTER POLICY "project_daily_feedback: admin/manager all"
  ON public.project_work_feedback RENAME TO "project_work_feedback: admin/manager all";
ALTER POLICY "project_daily_feedback: authorized user read"
  ON public.project_work_feedback RENAME TO "project_work_feedback: authorized user read";
ALTER POLICY "project_daily_feedback: owner delete"
  ON public.project_work_feedback RENAME TO "project_work_feedback: owner delete";
ALTER POLICY "project_daily_feedback: owner update"
  ON public.project_work_feedback RENAME TO "project_work_feedback: owner update";

ALTER POLICY "internal_project_daily_feedback: admin/manager delete any"
  ON public.internal_project_work_feedback RENAME TO "internal_project_work_feedback: admin/manager delete any";
ALTER POLICY "internal_project_daily_feedback: staff all"
  ON public.internal_project_work_feedback RENAME TO "internal_project_work_feedback: staff all";

-- ── 4. Invoice: work-period fields + merged account details ──────────────────
ALTER TABLE public.invoice
  ADD COLUMN IF NOT EXISTS account_details text,
  ADD COLUMN IF NOT EXISTS start_date       date,
  ADD COLUMN IF NOT EXISTS end_date         date,
  ADD COLUMN IF NOT EXISTS total_time       numeric;

-- Backfill account_details from the legacy SWIFT/BIC + IBAN columns so the
-- existing invoice keeps its payment info. Legacy columns are left in place
-- (no longer written by the app) to avoid a destructive drop.
UPDATE public.invoice
SET account_details = trim(both E'\n' FROM
      concat_ws(E'\n',
        CASE WHEN coalesce(swift_code, '') <> '' THEN 'SWIFT / BIC: ' || swift_code END,
        CASE WHEN coalesce(iban_code, '')  <> '' THEN 'IBAN: '        || iban_code  END
      ))
WHERE account_details IS NULL
  AND (coalesce(swift_code, '') <> '' OR coalesce(iban_code, '') <> '');
