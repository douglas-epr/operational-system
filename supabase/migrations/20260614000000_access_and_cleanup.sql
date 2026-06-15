-- ============================================================
-- Migration: access model rework + field/table cleanup
-- Applied with: npx supabase migration up (NOT db reset)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. idea.authorized_users column
-- ─────────────────────────────────────────
ALTER TABLE public.idea
  ADD COLUMN IF NOT EXISTS authorized_users uuid[] NOT NULL DEFAULT '{}';

-- ─────────────────────────────────────────
-- 2. Fix idea_update_version_on_project_change trigger
--    — also bail when user explicitly changed version_name
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.idea_update_version_on_project_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Bail if project didn't change, OR if the user explicitly set a version name
  IF NEW.project_id IS NOT DISTINCT FROM OLD.project_id
     OR NEW.version_name IS DISTINCT FROM OLD.version_name THEN
    RETURN NEW;
  END IF;

  IF NEW.project_id IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id IS NULL
      AND lower(name) = lower(NEW.name)
      AND id != NEW.id;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id = NEW.project_id
      AND id != NEW.id;
  END IF;

  NEW.version_name :=
    'Version ' || (v_count + 1)::text
    || ' - '
    || to_char(COALESCE(NEW.created_at, now()), 'DD/MM/YYYY HH24:MI');

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────
-- 3. idea RLS — drop old, keep owner, add authorized read
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "idea: admin/manager all" ON public.idea;
DROP POLICY IF EXISTS "idea: project authorized user read" ON public.idea;

CREATE POLICY "idea: authorized read" ON public.idea
  FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ─────────────────────────────────────────
-- 4. idea_* sub-table RLS — replace all with creator + authorized read
-- ─────────────────────────────────────────

-- idea_structure_and_align
DROP POLICY IF EXISTS "idea_structure: admin/manager all" ON public.idea_structure_and_align;
DROP POLICY IF EXISTS "idea_structure: creator all" ON public.idea_structure_and_align;
DROP POLICY IF EXISTS "idea_structure: project authorized user read" ON public.idea_structure_and_align;

CREATE POLICY "idea_structure_and_align: creator all" ON public.idea_structure_and_align
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_structure_and_align.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_structure_and_align.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_structure_and_align: authorized read" ON public.idea_structure_and_align
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_structure_and_align.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_icp
DROP POLICY IF EXISTS "idea_icp: admin/manager all" ON public.idea_icp;
DROP POLICY IF EXISTS "idea_icp: creator all" ON public.idea_icp;
DROP POLICY IF EXISTS "idea_icp: project authorized user read" ON public.idea_icp;

CREATE POLICY "idea_icp: creator all" ON public.idea_icp
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_icp.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_icp.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_icp: authorized read" ON public.idea_icp
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_icp.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_optimization_suggestion
DROP POLICY IF EXISTS "idea_optimization_suggestion: admin/manager all" ON public.idea_optimization_suggestion;
DROP POLICY IF EXISTS "idea_optimization_suggestion: creator all" ON public.idea_optimization_suggestion;
DROP POLICY IF EXISTS "idea_optimization_suggestion: project authorized user read" ON public.idea_optimization_suggestion;

CREATE POLICY "idea_optimization_suggestion: creator all" ON public.idea_optimization_suggestion
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_optimization_suggestion.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_optimization_suggestion.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_optimization_suggestion: authorized read" ON public.idea_optimization_suggestion
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_optimization_suggestion.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_product_definition_and_flows
DROP POLICY IF EXISTS "idea_pdef: admin/manager all" ON public.idea_product_definition_and_flows;
DROP POLICY IF EXISTS "idea_pdef: creator all" ON public.idea_product_definition_and_flows;
DROP POLICY IF EXISTS "idea_pdef: project authorized user read" ON public.idea_product_definition_and_flows;

CREATE POLICY "idea_product_definition_and_flows: creator all" ON public.idea_product_definition_and_flows
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_product_definition_and_flows.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_product_definition_and_flows.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_product_definition_and_flows: authorized read" ON public.idea_product_definition_and_flows
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_product_definition_and_flows.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_benchmarking (was wide-open _all)
DROP POLICY IF EXISTS "idea_benchmarking_all" ON public.idea_benchmarking;

CREATE POLICY "idea_benchmarking: creator all" ON public.idea_benchmarking
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_benchmarking.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_benchmarking.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_benchmarking: authorized read" ON public.idea_benchmarking
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_benchmarking.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_prd (was wide-open _all)
DROP POLICY IF EXISTS "idea_prd_all" ON public.idea_prd;

CREATE POLICY "idea_prd: creator all" ON public.idea_prd
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_prd.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_prd.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_prd: authorized read" ON public.idea_prd
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_prd.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_database (was wide-open _all)
DROP POLICY IF EXISTS "idea_database_all" ON public.idea_database;

CREATE POLICY "idea_database: creator all" ON public.idea_database
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_database.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_database.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_database: authorized read" ON public.idea_database
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_database.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_styles
DROP POLICY IF EXISTS "idea_styles: admin/manager all" ON public.idea_styles;
DROP POLICY IF EXISTS "idea_styles: creator all" ON public.idea_styles;
DROP POLICY IF EXISTS "idea_styles: project authorized user read" ON public.idea_styles;

CREATE POLICY "idea_styles: creator all" ON public.idea_styles
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_styles.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_styles.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_styles: authorized read" ON public.idea_styles
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_styles.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_milestones_and_tasks (was wide-open _all)
DROP POLICY IF EXISTS "idea_milestones_all" ON public.idea_milestones_and_tasks;

CREATE POLICY "idea_milestones_and_tasks: creator all" ON public.idea_milestones_and_tasks
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_milestones_and_tasks.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_milestones_and_tasks.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_milestones_and_tasks: authorized read" ON public.idea_milestones_and_tasks
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_milestones_and_tasks.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_report (was wide-open _all)
DROP POLICY IF EXISTS "idea_report_all" ON public.idea_report;

CREATE POLICY "idea_report: creator all" ON public.idea_report
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_report.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_report.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_report: authorized read" ON public.idea_report
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_report.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_chatbot (was wide-open _all)
DROP POLICY IF EXISTS "idea_chatbot_all" ON public.idea_chatbot;

CREATE POLICY "idea_chatbot: creator all" ON public.idea_chatbot
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_chatbot.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_chatbot.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_chatbot: authorized read" ON public.idea_chatbot
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_chatbot.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- idea_chatbot_devil_advocate
DROP POLICY IF EXISTS "idea_chatbot_devil_advocate: admin/manager all" ON public.idea_chatbot_devil_advocate;
DROP POLICY IF EXISTS "idea_chatbot_devil_advocate: creator all" ON public.idea_chatbot_devil_advocate;
DROP POLICY IF EXISTS "idea_chatbot_devil_advocate: project authorized user all" ON public.idea_chatbot_devil_advocate;

CREATE POLICY "idea_chatbot_devil_advocate: creator all" ON public.idea_chatbot_devil_advocate
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_chatbot_devil_advocate.idea_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_chatbot_devil_advocate.idea_id AND i.created_by = auth.uid()));

CREATE POLICY "idea_chatbot_devil_advocate: authorized read" ON public.idea_chatbot_devil_advocate
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_chatbot_devil_advocate.idea_id AND auth.uid() = ANY(i.authorized_users)));

-- ─────────────────────────────────────────
-- 5. mkt_* RLS — replace admin/manager + project member with idea members all
-- ─────────────────────────────────────────

-- mkt_ad_campaign
DROP POLICY IF EXISTS "mkt_ad_campaign: admin/manager all" ON public.mkt_ad_campaign;
DROP POLICY IF EXISTS "mkt_ad_campaign: project member all" ON public.mkt_ad_campaign;
CREATE POLICY "mkt_ad_campaign: idea members all" ON public.mkt_ad_campaign
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_ad_campaign.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_ad_campaign.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_campaign
DROP POLICY IF EXISTS "mkt_campaign: admin/manager all" ON public.mkt_campaign;
DROP POLICY IF EXISTS "mkt_campaign: project member all" ON public.mkt_campaign;
CREATE POLICY "mkt_campaign: idea members all" ON public.mkt_campaign
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_campaign.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_campaign.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_content
DROP POLICY IF EXISTS "mkt_content: admin/manager all" ON public.mkt_content;
DROP POLICY IF EXISTS "mkt_content: project member all" ON public.mkt_content;
CREATE POLICY "mkt_content: idea members all" ON public.mkt_content
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_content.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_content.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_decision_log
DROP POLICY IF EXISTS "mkt_decision_log: admin/manager all" ON public.mkt_decision_log;
DROP POLICY IF EXISTS "mkt_decision_log: project member all" ON public.mkt_decision_log;
CREATE POLICY "mkt_decision_log: idea members all" ON public.mkt_decision_log
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_decision_log.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_decision_log.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_event
DROP POLICY IF EXISTS "mkt_event: admin/manager all" ON public.mkt_event;
DROP POLICY IF EXISTS "mkt_event: project member all" ON public.mkt_event;
CREATE POLICY "mkt_event: idea members all" ON public.mkt_event
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_event.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_event.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_interview
DROP POLICY IF EXISTS "mkt_interview: admin/manager all" ON public.mkt_interview;
DROP POLICY IF EXISTS "mkt_interview: project member all" ON public.mkt_interview;
CREATE POLICY "mkt_interview: idea members all" ON public.mkt_interview
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_interview.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_interview.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_landing
DROP POLICY IF EXISTS "mkt_landing: admin/manager all" ON public.mkt_landing;
DROP POLICY IF EXISTS "mkt_landing: project member all" ON public.mkt_landing;
CREATE POLICY "mkt_landing: idea members all" ON public.mkt_landing
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_landing.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_landing.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_outreach
DROP POLICY IF EXISTS "mkt_outreach: admin/manager all" ON public.mkt_outreach;
DROP POLICY IF EXISTS "mkt_outreach: project member all" ON public.mkt_outreach;
CREATE POLICY "mkt_outreach: idea members all" ON public.mkt_outreach
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_outreach.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_outreach.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_prospect
DROP POLICY IF EXISTS "mkt_prospect: admin/manager all" ON public.mkt_prospect;
DROP POLICY IF EXISTS "mkt_prospect: project member all" ON public.mkt_prospect;
CREATE POLICY "mkt_prospect: idea members all" ON public.mkt_prospect
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_prospect.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_prospect.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_research_cache
DROP POLICY IF EXISTS "mkt_research_cache: admin/manager all" ON public.mkt_research_cache;
DROP POLICY IF EXISTS "mkt_research_cache: project member all" ON public.mkt_research_cache;
CREATE POLICY "mkt_research_cache: idea members all" ON public.mkt_research_cache
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_research_cache.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_research_cache.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_sequence_step
DROP POLICY IF EXISTS "mkt_sequence_step: admin/manager all" ON public.mkt_sequence_step;
DROP POLICY IF EXISTS "mkt_sequence_step: project member all" ON public.mkt_sequence_step;
CREATE POLICY "mkt_sequence_step: idea members all" ON public.mkt_sequence_step
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_sequence_step.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_sequence_step.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_signal
DROP POLICY IF EXISTS "mkt_signal: admin/manager all" ON public.mkt_signal;
DROP POLICY IF EXISTS "mkt_signal: project member all" ON public.mkt_signal;
CREATE POLICY "mkt_signal: idea members all" ON public.mkt_signal
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_signal.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_signal.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_source_run
DROP POLICY IF EXISTS "mkt_source_run: admin/manager all" ON public.mkt_source_run;
DROP POLICY IF EXISTS "mkt_source_run: project member all" ON public.mkt_source_run;
CREATE POLICY "mkt_source_run: idea members all" ON public.mkt_source_run
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_source_run.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_source_run.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_suppression
DROP POLICY IF EXISTS "mkt_suppression: admin/manager all" ON public.mkt_suppression;
DROP POLICY IF EXISTS "mkt_suppression: project member all" ON public.mkt_suppression;
CREATE POLICY "mkt_suppression: idea members all" ON public.mkt_suppression
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_suppression.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_suppression.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- mkt_validation
DROP POLICY IF EXISTS "mkt_validation: admin/manager all" ON public.mkt_validation;
DROP POLICY IF EXISTS "mkt_validation: project member all" ON public.mkt_validation;
CREATE POLICY "mkt_validation: idea members all" ON public.mkt_validation
  USING (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_validation.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.idea i WHERE i.id = mkt_validation.idea_id AND (i.created_by = auth.uid() OR auth.uid() = ANY(i.authorized_users))));

-- ─────────────────────────────────────────
-- 6. SOP: drop admin/manager + authorized_user_type policies,
--    drop authorized_user_types columns, add sop_version creator policy
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "sop: admin/manager all" ON public.sop;
DROP POLICY IF EXISTS "sop: authorized user type read" ON public.sop;
DROP POLICY IF EXISTS "sop_version: admin/manager all" ON public.sop_version;
DROP POLICY IF EXISTS "sop_version: authorized user type read" ON public.sop_version;

-- Drop indexes that reference the column before dropping the column
DROP INDEX IF EXISTS public.sop_authorized_user_types_idx;

ALTER TABLE public.sop DROP COLUMN IF EXISTS authorized_user_types;
ALTER TABLE public.sop_version DROP COLUMN IF EXISTS authorized_user_types;

CREATE POLICY "sop_version: creator manage own" ON public.sop_version
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ─────────────────────────────────────────
-- 7. project: drop pricing, program, stage, referral columns
--    (must drop BEFORE dropping talent/client/company tables)
-- ─────────────────────────────────────────
ALTER TABLE public.project
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS referrer_commission,
  DROP COLUMN IF EXISTS stage,
  DROP COLUMN IF EXISTS program,
  DROP COLUMN IF EXISTS recommended_by,
  DROP COLUMN IF EXISTS talent_who_recommended_id,
  DROP COLUMN IF EXISTS client_who_recommended_id,
  DROP COLUMN IF EXISTS company_that_recommended_id;

-- ─────────────────────────────────────────
-- 8. Drop project_qa_time_track table
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "qa_time_track: admin/manager all" ON public.project_qa_time_track;
DROP POLICY IF EXISTS "qa_time_track: operational all" ON public.project_qa_time_track;
DROP TABLE IF EXISTS public.project_qa_time_track;

-- ─────────────────────────────────────────
-- 9. Remove deleted task types from project_task
-- ─────────────────────────────────────────
DELETE FROM public.project_task WHERE type = 'stages_checking';
DELETE FROM public.project_task WHERE type = 'qa_requests';

-- ─────────────────────────────────────────
-- 10. Drop orphaned tables (FK children first, then parents)
-- ─────────────────────────────────────────

-- talent child tables
DROP TABLE IF EXISTS public.talent_tool;
DROP TABLE IF EXISTS public.talent_programming_language;
DROP TABLE IF EXISTS public.talent_referred_by;
DROP TABLE IF EXISTS public.client_who_referred_this_talent;

-- parent tables
DROP TABLE IF EXISTS public.talent;
DROP TABLE IF EXISTS public.client;
DROP TABLE IF EXISTS public.company;

-- ─────────────────────────────────────────
-- 11. Drop now-unused enums
-- ─────────────────────────────────────────
DROP TYPE IF EXISTS public.os_project_stage;
DROP TYPE IF EXISTS public.os_project_program;
DROP TYPE IF EXISTS public.os_recommended_by;
