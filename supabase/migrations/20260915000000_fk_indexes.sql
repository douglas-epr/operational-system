-- ============================================================
-- Migration: FK coverage indexes + duplicate-index cleanup
-- Audit date: 2026-09-15 (see database.md "Indexes" section and
-- .specs/features/db-indexes/spec.md for the full evidence trail)
--
-- Why: Postgres does not auto-index foreign-key columns, and this schema
-- is FK-rich + RLS-heavy (RLS EXISTS-subqueries filter child tables by
-- parent id on every read). ~39 child-table FK/filter columns were never
-- indexed, so every Ideas Refiner step load, project board and marketing
-- screen sequential-scans its children. Five index pairs also duplicate
-- the same column set under two naming styles, wasting write throughput
-- and shared-buffer memory for nothing.
--
-- Naming convention chosen for every NEW index in this file: idx_<table>_<column>
-- (this is the more common prefix style already in the baseline — see
-- idx_project_daily_feedback_project_id, idx_project_invoice_created_by,
-- idx_task_comment_project_id, etc. The competing `<table>_<col>_idx` suffix
-- style also exists in the baseline (e.g. idea_project_id_idx,
-- task_project_id_idx) but idx_-prefix is used here for consistency within
-- this migration and because it is what database.md documents as the
-- "known gaps" fix target.)
--
-- CONCURRENTLY is impossible inside a migration transaction (Supabase runs
-- every migration file in one transaction), so this file uses plain
-- `CREATE INDEX IF NOT EXISTS`. On the tables involved here that is fine
-- for a local rebuild. Before applying this migration to PRODUCTION,
-- either (a) schedule a maintenance window that tolerates a brief
-- ACCESS EXCLUSIVE-adjacent lock per CREATE INDEX (a plain CREATE INDEX
-- takes a SHARE lock, blocking writes but not reads, for the duration of
-- the build), or (b) re-issue the CREATE INDEX statements below as
-- `CREATE INDEX CONCURRENTLY` run individually outside a transaction
-- (psql, not the migration runner), then mark this migration as applied
-- without re-running it. Do not run `CREATE INDEX CONCURRENTLY` inside
-- this file — Postgres rejects it inside a transaction block.
--
-- Scope corrections vs. the original plan (verified directly against
-- supabase/migrations/*.sql before writing a single statement below):
--   - project_qa_time_track no longer exists (dropped in
--     20260614000000_access_and_cleanup.sql) — its task_id gap and its
--     duplicate index pair (qa_time_track_project_id_idx /
--     idx_qa_time_track_project_id) are both moot; neither is touched here.
--   - conversation_project_internal_message(_thread) no longer exist
--     (dropped in 20260615000000_cleanup_projects_chat_tabs.sql) — not
--     indexed here.
--   - internal_project_daily_feedback was renamed to
--     internal_project_work_feedback (20260626000000) — indexed under the
--     new name.
--   - project_playbook_comment / project_playbook_comment_reply /
--     project_playbook_version were renamed to idea_playbook_comment /
--     idea_playbook_comment_reply / idea_playbook_version
--     (20260614180000) and now key on idea_id (project_id was dropped from
--     all three) — indexed under the new names, on idea_id.
--   - project_invoice was renamed to invoice (20260614120000); its
--     Tier-2 creator index (idx_project_invoice_created_by) survived the
--     rename attached to the renamed table, so no new index is needed for it.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. idea_id — 17 tables (verified: column exists, no covering index)
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_idea_location_legislation_idea_id
  ON public.idea_location_legislation (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_market_opportunity_idea_id
  ON public.idea_market_opportunity (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_risk_and_validation_idea_id
  ON public.idea_risk_and_validation (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_optimization_suggestion_idea_id
  ON public.idea_optimization_suggestion (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_product_definition_and_flows_idea_id
  ON public.idea_product_definition_and_flows (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_structure_and_align_idea_id
  ON public.idea_structure_and_align (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_campaign_idea_id
  ON public.mkt_campaign (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_content_idea_id
  ON public.mkt_content (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_landing_idea_id
  ON public.mkt_landing (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_outreach_idea_id
  ON public.mkt_outreach (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_prospect_idea_id
  ON public.mkt_prospect (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_sequence_step_idea_id
  ON public.mkt_sequence_step (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_source_run_idea_id
  ON public.mkt_source_run (idea_id);

CREATE INDEX IF NOT EXISTS idx_mkt_suppression_idea_id
  ON public.mkt_suppression (idea_id);

-- Renamed from project_playbook_version/comment/comment_reply (20260614180000);
-- project_id was dropped from these tables, idea_id is the live FK now.
CREATE INDEX IF NOT EXISTS idx_idea_playbook_version_idea_id
  ON public.idea_playbook_version (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_playbook_comment_idea_id
  ON public.idea_playbook_comment (idea_id);

CREATE INDEX IF NOT EXISTS idx_idea_playbook_comment_reply_idea_id
  ON public.idea_playbook_comment_reply (idea_id);

-- ─────────────────────────────────────────────────────────────
-- 2. landing_id — 3 tables
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mkt_ad_campaign_landing_id
  ON public.mkt_ad_campaign (landing_id);

CREATE INDEX IF NOT EXISTS idx_mkt_event_landing_id
  ON public.mkt_event (landing_id);

CREATE INDEX IF NOT EXISTS idx_mkt_signal_landing_id
  ON public.mkt_signal (landing_id);

-- ─────────────────────────────────────────────────────────────
-- 3. internal_project_id — 7 tables
-- ─────────────────────────────────────────────────────────────

-- Renamed from internal_project_daily_feedback (20260626000000).
CREATE INDEX IF NOT EXISTS idx_internal_project_work_feedback_internal_project_id
  ON public.internal_project_work_feedback (internal_project_id);

CREATE INDEX IF NOT EXISTS idx_internal_project_file_internal_project_id
  ON public.internal_project_file (internal_project_id);

CREATE INDEX IF NOT EXISTS idx_internal_project_link_internal_project_id
  ON public.internal_project_link (internal_project_id);

CREATE INDEX IF NOT EXISTS idx_internal_project_video_internal_project_id
  ON public.internal_project_video (internal_project_id);

CREATE INDEX IF NOT EXISTS idx_internal_project_task_comment_internal_project_id
  ON public.internal_project_task_comment (internal_project_id);

CREATE INDEX IF NOT EXISTS idx_internal_project_task_time_track_internal_project_id
  ON public.internal_project_task_time_track (internal_project_id);

CREATE INDEX IF NOT EXISTS idx_conv_internal_project_message_thread_internal_project_id
  ON public.conversation_internal_project_message_thread (internal_project_id);

-- ─────────────────────────────────────────────────────────────
-- 4. project_id — 2 tables (conversation_project_internal_message_thread
--    and project_qa_time_track were removed from this list; see header)
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_feedback_project_id
  ON public.feedback (project_id);

CREATE INDEX IF NOT EXISTS idx_conv_project_external_message_thread_project_id
  ON public.conversation_project_external_message_thread (project_id);

-- ─────────────────────────────────────────────────────────────
-- 5. task_id — 2 tables (project_qa_time_track removed from this list;
--    see header)
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_project_task_comment_task_id
  ON public.project_task_comment (task_id);

CREATE INDEX IF NOT EXISTS idx_project_task_time_track_task_id
  ON public.project_task_time_track (task_id);

-- ─────────────────────────────────────────────────────────────
-- 6. campaign_id / prospect_id — marketing outreach tables
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mkt_outreach_campaign_id
  ON public.mkt_outreach (campaign_id);

CREATE INDEX IF NOT EXISTS idx_mkt_outreach_prospect_id
  ON public.mkt_outreach (prospect_id);

-- mkt_interview.idea_id is already indexed (mkt_interview_idea_idx);
-- prospect_id is the uncovered column here.
CREATE INDEX IF NOT EXISTS idx_mkt_interview_prospect_id
  ON public.mkt_interview (prospect_id);

-- ─────────────────────────────────────────────────────────────
-- 7. created_by — tables carrying a literal Tier-2 creator policy
--    (`FOR ALL USING (created_by = auth.uid())`, CLAUDE.md's "Standard
--    three-tier RLS model" §Tier 2). Found by grepping every migration for
--    `created_by = auth.uid()` and keeping only the direct, top-level,
--    FOR-ALL-on-own-row matches (excluding EXISTS-subquery joins to a
--    *different* table's created_by, and excluding older split
--    per-command "owner delete"/"owner update" policies on feedback,
--    project_daily_feedback, project_file, project_link, project_video,
--    idea_playbook_comment/_reply — a different, non-Tier-2 shape; see
--    report for the full list considered and excluded).
--    invoice (renamed from project_invoice) already has
--    idx_project_invoice_created_by, carried over through the rename, so
--    it is not repeated here.
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_idea_created_by
  ON public.idea (created_by);

CREATE INDEX IF NOT EXISTS idx_sop_created_by
  ON public.sop (created_by);

CREATE INDEX IF NOT EXISTS idx_sop_version_created_by
  ON public.sop_version (created_by);

CREATE INDEX IF NOT EXISTS idx_idea_playbook_version_created_by
  ON public.idea_playbook_version (created_by);

CREATE INDEX IF NOT EXISTS idx_project_task_comment_created_by
  ON public.project_task_comment (created_by);

-- ─────────────────────────────────────────────────────────────
-- 8. Drop the redundant twin of each verified duplicate index pair.
--    Verified by reading the baseline: all 4 pairs are plain btree,
--    single-column, no predicate, no UNIQUE constraint involved — truly
--    identical. The 5th pair from the original audit
--    (qa_time_track_project_id_idx / idx_qa_time_track_project_id) no
--    longer exists — project_qa_time_track was dropped entirely in
--    20260614000000_access_and_cleanup.sql, so both indexes are already
--    gone; nothing to drop there.
-- ─────────────────────────────────────────────────────────────

-- idea(project_id): keep idea_project_id_idx, drop the idx_-prefixed twin
DROP INDEX IF EXISTS public.idx_idea_project_id;

-- project_task(project_id): keep task_project_id_idx, drop the idx_-prefixed twin
DROP INDEX IF EXISTS public.idx_task_project_id;

-- project_task_time_track(project_id): keep time_track_project_id_idx, drop the idx_-prefixed twin
DROP INDEX IF EXISTS public.idx_time_track_project_id;

-- internal_key_result(internal_goal_id): neither name carries the idx_ prefix;
-- keep the one whose name spells out the full column (internal_goal_id),
-- drop the abbreviated twin (internal_key_result_goal_idx).
DROP INDEX IF EXISTS public.internal_key_result_goal_idx;

NOTIFY pgrst, 'reload schema';
