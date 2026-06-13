


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."agency_role" AS ENUM (
    'admin',
    'manager',
    'content_creator'
);


ALTER TYPE "public"."agency_role" OWNER TO "postgres";


CREATE TYPE "public"."connection_status" AS ENUM (
    'active',
    'pending',
    'failed'
);


ALTER TYPE "public"."connection_status" OWNER TO "postgres";


CREATE TYPE "public"."content_source" AS ENUM (
    'autopilot',
    'manual'
);


ALTER TYPE "public"."content_source" OWNER TO "postgres";


CREATE TYPE "public"."internal_goal_status" AS ENUM (
    'prospecting',
    'not_started',
    'in_progress',
    'done',
    'archived',
    'blocked'
);


ALTER TYPE "public"."internal_goal_status" OWNER TO "postgres";


CREATE TYPE "public"."internal_key_result_status" AS ENUM (
    'not_started',
    'in_progress',
    'ready_for_qa',
    'done',
    'blocked',
    'archived'
);


ALTER TYPE "public"."internal_key_result_status" OWNER TO "postgres";


CREATE TYPE "public"."mkt_channel" AS ENUM (
    'email',
    'linkedin',
    'google_maps',
    'instagram',
    'facebook',
    'reddit',
    'x',
    'social_discovery'
);


ALTER TYPE "public"."mkt_channel" OWNER TO "postgres";


CREATE TYPE "public"."mkt_content_status" AS ENUM (
    'draft',
    'scheduled',
    'posted',
    'failed'
);


ALTER TYPE "public"."mkt_content_status" OWNER TO "postgres";


CREATE TYPE "public"."mkt_funnel_mode" AS ENUM (
    'b2b_outreach',
    'consumer_capture',
    'hybrid'
);


ALTER TYPE "public"."mkt_funnel_mode" OWNER TO "postgres";


CREATE TYPE "public"."mkt_outreach_status" AS ENUM (
    'queued',
    'sent',
    'opened',
    'replied',
    'bounced',
    'unsub'
);


ALTER TYPE "public"."mkt_outreach_status" OWNER TO "postgres";


CREATE TYPE "public"."mkt_signal_type" AS ENUM (
    'quiz',
    'waitlist',
    'preorder'
);


ALTER TYPE "public"."mkt_signal_type" OWNER TO "postgres";


CREATE TYPE "public"."mkt_validation_status" AS ENUM (
    'validating',
    'killed',
    'doubling_down'
);


ALTER TYPE "public"."mkt_validation_status" OWNER TO "postgres";


CREATE TYPE "public"."os_agreement_status" AS ENUM (
    'not_available',
    'ready_to_sign',
    'completed',
    'archived'
);


ALTER TYPE "public"."os_agreement_status" OWNER TO "postgres";


CREATE TYPE "public"."os_agreement_type" AS ENUM (
    'nda',
    'proposal_quotation',
    'service_agreement',
    'launch_handoff'
);


ALTER TYPE "public"."os_agreement_type" OWNER TO "postgres";


CREATE TYPE "public"."os_ai_service" AS ENUM (
    'gemini',
    'claude',
    'openai'
);


ALTER TYPE "public"."os_ai_service" OWNER TO "postgres";


CREATE TYPE "public"."os_ai_status" AS ENUM (
    'pending',
    'in_progress',
    'done'
);


ALTER TYPE "public"."os_ai_status" OWNER TO "postgres";


CREATE TYPE "public"."os_company_sector" AS ENUM (
    'organizational',
    'operational',
    'marketing'
);


ALTER TYPE "public"."os_company_sector" OWNER TO "postgres";


CREATE TYPE "public"."os_docs_type" AS ENUM (
    'playbook',
    'agreements',
    'general_docs',
    'links',
    'main_videos',
    'daily_communication',
    'invoices'
);


ALTER TYPE "public"."os_docs_type" OWNER TO "postgres";


CREATE TYPE "public"."os_idea_block" AS ENUM (
    'ideas',
    'structure_align',
    'refining_icp',
    'product_definition_flows',
    'strategic_frameworks',
    'benchmarking',
    'prd',
    'database',
    'visual_styles',
    'milestones_and_tasks',
    'report'
);


ALTER TYPE "public"."os_idea_block" OWNER TO "postgres";


CREATE TYPE "public"."os_idea_chatbot_message_type" AS ENUM (
    'user',
    'chatbot'
);


ALTER TYPE "public"."os_idea_chatbot_message_type" OWNER TO "postgres";


CREATE TYPE "public"."os_idea_field" AS ENUM (
    'product_overview',
    'essential_features',
    'user_flows',
    'value_proposition',
    'jtbd_synthesis',
    'icp_architect',
    'nabc_pitch',
    'structure_align',
    'humanizing_target_audience',
    'primary_success_metric',
    'day_in_life',
    'pain_points_acute_needs'
);


ALTER TYPE "public"."os_idea_field" OWNER TO "postgres";


CREATE TYPE "public"."os_internal_goals_status" AS ENUM (
    'prospecting',
    'not_started',
    'in_progress',
    'done',
    'archived',
    'blocked'
);


ALTER TYPE "public"."os_internal_goals_status" OWNER TO "postgres";


CREATE TYPE "public"."os_internal_key_result_status" AS ENUM (
    'not_started',
    'in_progress',
    'ready_for_qa',
    'done',
    'blocked',
    'archived'
);


ALTER TYPE "public"."os_internal_key_result_status" OWNER TO "postgres";


CREATE TYPE "public"."os_internal_project_status" AS ENUM (
    'not_started',
    'in_progress',
    'ready_for_qa',
    'done',
    'blocked',
    'archived'
);


ALTER TYPE "public"."os_internal_project_status" OWNER TO "postgres";


CREATE TYPE "public"."os_internal_task_status" AS ENUM (
    'not_started',
    'in_progress',
    'done',
    'blocked'
);


ALTER TYPE "public"."os_internal_task_status" OWNER TO "postgres";


CREATE TYPE "public"."os_message_author_type" AS ENUM (
    'user',
    'chatbot'
);


ALTER TYPE "public"."os_message_author_type" OWNER TO "postgres";


CREATE TYPE "public"."os_playbook_comment_status" AS ENUM (
    'pending',
    'solved'
);


ALTER TYPE "public"."os_playbook_comment_status" OWNER TO "postgres";


CREATE TYPE "public"."os_professional_type" AS ENUM (
    'developer',
    'marketing'
);


ALTER TYPE "public"."os_professional_type" OWNER TO "postgres";


CREATE TYPE "public"."os_programming_language" AS ENUM (
    'javascript',
    'php',
    'html_css',
    'sql',
    'vba',
    'python',
    'react_native',
    'ruby',
    'dart',
    'csharp',
    'cpp',
    'typescript',
    'kotlin',
    'swift',
    'solidity',
    'go',
    'rust',
    'java',
    'scala',
    'elixir',
    'erlang',
    'haskell',
    'clojure',
    'fsharp',
    'ocaml',
    'julia',
    'r_lang',
    'matlab',
    'lua',
    'perl',
    'bash',
    'powershell',
    'objective_c',
    'groovy',
    'assembly',
    'graphql',
    'nosql',
    'shell',
    'crystal',
    'nim',
    'zig',
    'd_lang',
    'fortran',
    'cobol'
);


ALTER TYPE "public"."os_programming_language" OWNER TO "postgres";


CREATE TYPE "public"."os_project_program" AS ENUM (
    'sandbox_launch',
    'market_ready_product',
    'scale_ready_system',
    'subscription'
);


ALTER TYPE "public"."os_project_program" OWNER TO "postgres";


CREATE TYPE "public"."os_project_stage" AS ENUM (
    'discovery_call',
    'system_activation',
    'nda',
    'info_gathering_meeting',
    'client_slack_channel',
    'playbook',
    'proposal',
    'service_agreement',
    'kickoff_meeting',
    'initial_invoice',
    'screens_development',
    'prototype_development',
    'video_explaining',
    'developer_search_onboarding',
    'app_development',
    'launch_handoff',
    'final_invoice',
    'completed'
);


ALTER TYPE "public"."os_project_stage" OWNER TO "postgres";


CREATE TYPE "public"."os_project_status" AS ENUM (
    'prospecting',
    'not_started',
    'in_progress',
    'done',
    'blocked',
    'archived',
    'lost_deal'
);


ALTER TYPE "public"."os_project_status" OWNER TO "postgres";


CREATE TYPE "public"."os_recommended_by" AS ENUM (
    'dev_agency_owner',
    'client'
);


ALTER TYPE "public"."os_recommended_by" OWNER TO "postgres";


CREATE TYPE "public"."os_talent_authority_level" AS ENUM (
    'rock_star',
    'known',
    'unknown',
    'rising_star',
    'explorer'
);


ALTER TYPE "public"."os_talent_authority_level" OWNER TO "postgres";


CREATE TYPE "public"."os_talent_level" AS ENUM (
    'agency_owner',
    'cto',
    'tech_lead',
    'senior',
    'mid_level',
    'junior'
);


ALTER TYPE "public"."os_talent_level" OWNER TO "postgres";


CREATE TYPE "public"."os_task_level" AS ENUM (
    'level_1',
    'level_2',
    'level_3',
    'level_4'
);


ALTER TYPE "public"."os_task_level" OWNER TO "postgres";


CREATE TYPE "public"."os_task_name" AS ENUM (
    'milestone_1_sign_in_sign_up',
    'milestone_2_core_client_flows',
    'milestone_3_seller_core_flows',
    'milestone_4_admin_flows',
    'milestone_5_final_qa_handoff',
    'client_requests',
    'qa_requests'
);


ALTER TYPE "public"."os_task_name" OWNER TO "postgres";


CREATE TYPE "public"."os_task_priority" AS ENUM (
    'blocker',
    'critical',
    'high',
    'medium',
    'low',
    'trivial'
);


ALTER TYPE "public"."os_task_priority" OWNER TO "postgres";


CREATE TYPE "public"."os_task_status" AS ENUM (
    'not_started',
    'in_progress',
    'ready_for_qa',
    'done',
    'blocked'
);


ALTER TYPE "public"."os_task_status" OWNER TO "postgres";


CREATE TYPE "public"."os_task_type" AS ENUM (
    'internal_checklist',
    'stages_checking',
    'developer_tasks',
    'client_requests',
    'qa_requests'
);


ALTER TYPE "public"."os_task_type" OWNER TO "postgres";


CREATE TYPE "public"."os_theme_choice" AS ENUM (
    'light',
    'dark'
);


ALTER TYPE "public"."os_theme_choice" OWNER TO "postgres";


CREATE TYPE "public"."os_tool" AS ENUM (
    'replit',
    'bubble',
    'n8n',
    'supabase',
    'xano',
    'javascript',
    'weweb',
    'flutterflow',
    'lovable',
    'cursor',
    'figma_design',
    'figma_make',
    'make',
    'adalo',
    'airtable',
    'webflow',
    'zapier',
    'claude_code',
    'antigravity',
    'github_copilot',
    'windsurf',
    'codeium',
    'aider',
    'devin',
    'v0',
    'bolt',
    'tempo',
    'framer',
    'plasmic',
    'wix',
    'squarespace',
    'shopify',
    'retool',
    'glide',
    'softr',
    'draftbit',
    'firebase',
    'hasura',
    'postgres',
    'mongodb',
    'mysql',
    'redis',
    'planetscale',
    'neon',
    'sketch',
    'adobe_xd',
    'photoshop',
    'illustrator',
    'after_effects',
    'premiere',
    'miro',
    'vercel',
    'netlify',
    'github',
    'gitlab',
    'docker',
    'kubernetes',
    'aws',
    'gcp',
    'azure',
    'cloudflare',
    'notion',
    'slack',
    'linear',
    'jira',
    'asana',
    'monday',
    'trello',
    'clickup',
    'loom',
    'openai',
    'anthropic_api',
    'langchain',
    'pinecone',
    'stripe',
    'twilio',
    'sendgrid',
    'segment',
    'mixpanel',
    'amplitude',
    'posthog'
);


ALTER TYPE "public"."os_tool" OWNER TO "postgres";


CREATE TYPE "public"."os_user_type" AS ENUM (
    'admin',
    'manager',
    'operational',
    'developer',
    'client',
    'qa',
    'referrer',
    'lead'
);


ALTER TYPE "public"."os_user_type" OWNER TO "postgres";


CREATE TYPE "public"."os_view_type" AS ENUM (
    'list',
    'kanban'
);


ALTER TYPE "public"."os_view_type" OWNER TO "postgres";


CREATE TYPE "public"."platform_role" AS ENUM (
    'manager',
    'staff'
);


ALTER TYPE "public"."platform_role" OWNER TO "postgres";


CREATE TYPE "public"."post_status" AS ENUM (
    'generating',
    'pending',
    'approved',
    'scheduled',
    'published',
    'failed'
);


ALTER TYPE "public"."post_status" OWNER TO "postgres";


CREATE TYPE "public"."workspace_role" AS ENUM (
    'admin',
    'marketing_manager',
    'viewer'
);


ALTER TYPE "public"."workspace_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_write_workspace"("p_workspace" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with w as (select agency_id from workspaces where id = p_workspace)
  select
    exists (select 1 from memberships
            where user_id = auth.uid() and workspace_id = p_workspace
              and workspace_role in ('admin', 'marketing_manager'))
    or exists (select 1 from memberships m, w
               where m.user_id = auth.uid() and m.agency_id = w.agency_id
                 and m.agency_role in ('admin', 'manager', 'content_creator'));
$$;


ALTER FUNCTION "public"."can_write_workspace"("p_workspace" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."feedback_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."feedback_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fill_project_conversation_users"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.external_conversation_authorized_users := COALESCE(
    (SELECT array_agg(p.id) FROM profiles p
      WHERE p.id = ANY(NEW.authorized_users)
        AND p.type IN ('admin','manager','operational','developer','client')),
    '{}'::UUID[]);
  NEW.internal_conversation_authorized_users := COALESCE(
    (SELECT array_agg(p.id) FROM profiles p
      WHERE p.id = ANY(NEW.authorized_users)
        AND p.type IN ('admin','manager','operational','developer')),
    '{}'::UUID[]);
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."fill_project_conversation_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_talent_by_code"("p_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_talent_by_code"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_type"() RETURNS "public"."os_user_type"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT type FROM public.profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_user_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_agency_role"("p_agency" "uuid", "p_role" "public"."agency_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and agency_id = p_agency and agency_role = p_role
  );
$$;


ALTER FUNCTION "public"."has_agency_role"("p_agency" "uuid", "p_role" "public"."agency_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."idea_auto_version_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.project_id IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id IS NULL
      AND lower(name) = lower(NEW.name);
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id = NEW.project_id;
  END IF;

  NEW.version_name :=
    'Version ' || (v_count + 1)::text
    || ' - '
    || to_char(COALESCE(NEW.created_at, now()), 'DD/MM/YYYY HH24:MI');

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."idea_auto_version_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."idea_update_version_on_project_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.project_id IS NOT DISTINCT FROM OLD.project_id THEN
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


ALTER FUNCTION "public"."idea_update_version_on_project_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT type IN ('admin', 'manager') FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;


ALTER FUNCTION "public"."is_admin_or_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_agency_member"("p_agency" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid()
      and (agency_id = p_agency
           or workspace_id in (select id from workspaces where agency_id = p_agency))
  );
$$;


ALTER FUNCTION "public"."is_agency_member"("p_agency" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_operational_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT type IN ('developer', 'client', 'qa') FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;


ALTER FUNCTION "public"."is_operational_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from memberships where user_id = auth.uid() and platform_role = 'manager');
$$;


ALTER FUNCTION "public"."is_platform_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from memberships where user_id = auth.uid() and platform_role is not null);
$$;


ALTER FUNCTION "public"."is_platform_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff_role"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT public.get_user_type() = ANY (
    ARRAY['admin'::public.os_user_type, 'manager'::public.os_user_type, 'operational'::public.os_user_type]
  )
$$;


ALTER FUNCTION "public"."is_staff_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_member"("p_workspace" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with w as (select agency_id from workspaces where id = p_workspace)
  select
    exists (select 1 from memberships where user_id = auth.uid() and workspace_id = p_workspace)
    or exists (select 1 from memberships m, w where m.user_id = auth.uid() and m.agency_id = w.agency_id);
$$;


ALTER FUNCTION "public"."is_workspace_member"("p_workspace" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_internal_project_messages_viewed"("p_internal_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_internal_project_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE internal_project_id = p_internal_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_internal_project_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE internal_project_id = p_internal_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_conversation_internal_project_messages_viewed"("p_internal_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_internal_project_thread_viewed"("p_parent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_internal_project_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_conversation_internal_project_thread_viewed"("p_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_external_project_messages_viewed"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_project_external_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_project_external_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_external_project_messages_viewed"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_external_project_thread_viewed"("p_parent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_project_external_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_external_project_thread_viewed"("p_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_internal_project_messages_viewed"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_project_internal_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_project_internal_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_id = p_project_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_internal_project_messages_viewed"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_internal_project_thread_viewed"("p_parent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_project_internal_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_internal_project_thread_viewed"("p_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_internal_task_comments_viewed"("p_internal_task_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE public.internal_task_comment
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE internal_task_id = p_internal_task_id
     AND owner_id <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;


ALTER FUNCTION "public"."mark_internal_task_comments_viewed"("p_internal_task_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_playbook_comment_replies_viewed"("p_comment_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE public.project_playbook_comment_reply
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE project_playbook_comment_id = p_comment_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;


ALTER FUNCTION "public"."mark_playbook_comment_replies_viewed"("p_comment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_playbook_comments_viewed"("p_playbook_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE public.project_playbook_comment
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE playbook_id = p_playbook_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;


ALTER FUNCTION "public"."mark_playbook_comments_viewed"("p_playbook_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_private_conversation_messages_viewed"("p_conversation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_private_message
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE conversation_id = p_conversation_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));

  UPDATE public.conversation_private_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE conversation_id = p_conversation_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_private_conversation_messages_viewed"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_private_conversation_thread_viewed"("p_parent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversation_private_message_thread
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE parent_id = p_parent_id
     AND created_by <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
END;
$$;


ALTER FUNCTION "public"."mark_private_conversation_thread_viewed"("p_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_task_comments_viewed"("p_task_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE public.task_comment
     SET viewed_by = array_append(viewed_by, auth.uid())
   WHERE task_id = p_task_id
     AND owner_id <> auth.uid()
     AND NOT (auth.uid() = ANY(viewed_by));
$$;


ALTER FUNCTION "public"."mark_task_comments_viewed"("p_task_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."project_agreement_version_auto_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'ready_to_sign'
     AND array_length(NEW.required_signers, 1) IS NOT NULL
     AND NEW.required_signers <@ NEW.signed_by THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."project_agreement_version_auto_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."project_invoice_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."project_invoice_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_table_columns"("p_table" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT c.column_name::TEXT, c.data_type::TEXT, c.is_nullable::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table
  ORDER BY c.ordinal_position;
$$;


ALTER FUNCTION "public"."public_table_columns"("p_table" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_table_list"() RETURNS "text"[]
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(array_agg(table_name ORDER BY table_name), ARRAY[]::TEXT[])
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
$$;


ALTER FUNCTION "public"."public_table_list"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sign_agreement"("p_agreement_id" "uuid") RETURNS TABLE("signed_by" "uuid"[], "status" "public"."os_agreement_status")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_authorized_users UUID[];
  v_project_users    UUID[];
  v_required_signers UUID[];
  v_signed_by        UUID[];
  v_status           public.os_agreement_status;
  v_uid              UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT pav.authorized_users, pav.required_signers, pav.signed_by, pav.status,
         p.authorized_users
    INTO v_authorized_users, v_required_signers, v_signed_by, v_status,
         v_project_users
    FROM public.project_agreement_version pav
    LEFT JOIN public.project p ON p.id = pav.project_id
   WHERE pav.id = p_agreement_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Agreement not found';
  END IF;

  IF NOT (v_uid = ANY(v_authorized_users))
     AND NOT (v_uid = ANY(v_project_users)) THEN
    RAISE EXCEPTION 'Not authorized to sign this agreement';
  END IF;

  IF v_status <> 'ready_to_sign' THEN
    RAISE EXCEPTION 'Agreement is not ready to be signed (current status: %)', v_status;
  END IF;

  IF NOT (v_uid = ANY(v_signed_by)) THEN
    v_signed_by := array_append(v_signed_by, v_uid);
  END IF;

  IF array_length(v_required_signers, 1) IS NOT NULL
     AND v_required_signers <@ v_signed_by THEN
    v_status := 'completed';
  END IF;

  UPDATE public.project_agreement_version pav
     SET signed_by  = v_signed_by,
         status     = v_status,
         updated_at = NOW()
   WHERE pav.id = p_agreement_id;

  RETURN QUERY SELECT v_signed_by, v_status;
END
$$;


ALTER FUNCTION "public"."sign_agreement"("p_agreement_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."talent_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;


ALTER FUNCTION "public"."talent_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_project_chatbot_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_project_chatbot_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_talent_by_code"("p_code" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."update_talent_by_code"("p_code" "text", "p_payload" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agency" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "website" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agency" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agency_ai_settings" (
    "agency_id" "uuid" NOT NULL,
    "active_service" "public"."os_ai_service",
    "openai_api_key" "text",
    "openai_model" "text" DEFAULT 'gpt-4.1'::"text",
    "gemini_api_key" "text",
    "gemini_model" "text" DEFAULT 'gemini-2.5-flash'::"text",
    "claude_api_key" "text",
    "claude_model" "text" DEFAULT 'claude-sonnet-4-20250514'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agency_ai_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agreement_template" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."agreement_template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text",
    "phone" "text",
    "linkedin" "text",
    "picture" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."client" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_who_referred_this_talent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "score" numeric,
    "description" "text",
    "talent_id" "uuid",
    "client_id" "uuid",
    "level" "public"."os_talent_level",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_who_referred_this_talent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_internal_project_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "author_type" "public"."os_message_author_type" DEFAULT 'user'::"public"."os_message_author_type" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_internal_project_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_internal_project_message_thread" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "internal_project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_internal_project_message_thread" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_private" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_user_ids" "uuid"[] NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_private" OWNER TO "postgres";


COMMENT ON COLUMN "public"."conversation_private"."title" IS 'Optional human-readable title — used for groups (3+ participants). Null for 1:1 DMs.';



CREATE TABLE IF NOT EXISTS "public"."conversation_private_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "author_type" "public"."os_message_author_type" DEFAULT 'user'::"public"."os_message_author_type" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_private_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_private_message_thread" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_private_message_thread" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_project_external_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "author_type" "public"."os_message_author_type" DEFAULT 'user'::"public"."os_message_author_type" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_project_external_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_project_external_message_thread" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_project_external_message_thread" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_project_internal_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "author_type" "public"."os_message_author_type" DEFAULT 'user'::"public"."os_message_author_type" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_project_internal_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_project_internal_message_thread" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "links" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation_project_internal_message_thread" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "comment" "text",
    "rating" numeric,
    "user_type" "public"."os_user_type",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "created_by" "uuid",
    "name" "text" NOT NULL,
    "score" numeric,
    "description" "text",
    "success_metrics" "text",
    "current_block_ended" "public"."os_idea_block",
    "current_blocks_updating" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_ai_request_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "version_name" "text"
);


ALTER TABLE "public"."idea" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_benchmarking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "overview" "text",
    "comparison" "text",
    "takeaways" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "possible_business_models" "text",
    "created_by" "uuid"
);


ALTER TABLE "public"."idea_benchmarking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_chatbot" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "type" "public"."os_idea_chatbot_message_type" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_chatbot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_chatbot_devil_advocate" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "type" "public"."os_idea_chatbot_message_type" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_chatbot_devil_advocate" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_database" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "tables_schema" "text",
    "relationships" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."idea_database" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_icp" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid",
    "name" "text",
    "title" "text",
    "subtitle" "text",
    "description" "text",
    "day_in_life" "text",
    "score" numeric,
    "picture" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "jtbd" "text",
    "pitch_need" "text",
    "pain_points" "text",
    "firmographics" "text",
    "pitch_benefit" "text",
    "pitch_approach" "text",
    "psychographics" "text",
    "pitch_competition" "text",
    "value_proposition_icp_pains" "text",
    "value_proposition_icp_gains" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "how_problems_are_solved" "text",
    "how_problems_could_be_solved" "text",
    "our_solution_value" "text",
    "value_proposition_value_map_solutions" "text",
    "value_proposition_value_map_gain_creators" "text",
    "score_rationale" "text",
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_icp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_milestones_and_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."idea_milestones_and_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_optimization_suggestion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid",
    "icp_id" "uuid",
    "name" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_optimization_suggestion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_prd" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "app_overview" "text",
    "objectives" "text",
    "priority_personas" "text",
    "essential_features" "text",
    "user_flow" "text",
    "non_functional_reqs" "text",
    "out_of_scope" "text",
    "success_indicators" "text",
    "phasing_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."idea_prd" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_product_definition_and_flows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid",
    "created_by" "uuid",
    "summary" "text",
    "features" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_model" "text",
    "go_to_market" "text"
);


ALTER TABLE "public"."idea_product_definition_and_flows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_report" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "final_score" integer,
    "threshold_bucket" "text",
    "headline" "text",
    "summary" "text",
    "area_scores" "jsonb",
    "penalties" "jsonb",
    "next_steps" "text",
    "playbook_title" "text",
    "playbook_subtitle" "text",
    "playbook_html" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "agreed_problem" "text",
    "agreed_solution" "text",
    "recommendation" "text",
    "revised_description" "text",
    "completeness_score" numeric,
    "alignment" "jsonb",
    "debate_transcript" "jsonb",
    "debate_meta" "jsonb",
    CONSTRAINT "idea_report_final_score_check" CHECK ((("final_score" >= 0) AND ("final_score" <= 100))),
    CONSTRAINT "idea_report_threshold_bucket_check" CHECK (("threshold_bucket" = ANY (ARRAY['build'::"text", 'refine'::"text", 'kill'::"text", 'ready'::"text", 'risk'::"text"])))
);


ALTER TABLE "public"."idea_report" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_structure_and_align" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid",
    "success_metrics_text" "text",
    "product_overview_text" "text",
    "essential_features_text" "text",
    "success_metrics" "text",
    "target_audience" "text",
    "core_problem" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_structure_and_align" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_styles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "logo_branding" "text",
    "color_palette" "text",
    "product_feeling" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "primary_color" "text",
    "secondary_color" "text",
    "accent_color" "text",
    "neutral_color" "text",
    "color_tokens" "jsonb",
    "typography" "jsonb",
    "spacing" "jsonb",
    "border_radius" "jsonb",
    "shadows" "jsonb",
    "brand_voice" "text",
    "iconography_style" "text",
    "motion_principles" "text"
);


ALTER TABLE "public"."idea_styles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_goal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "order" integer,
    "description" "text",
    "status" "public"."os_internal_goals_status" DEFAULT 'not_started'::"public"."os_internal_goals_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internal_goal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_key_result" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_goal_id" "uuid",
    "name" "text",
    "order" integer,
    "start_date" "date",
    "end_date" "date",
    "achieved" boolean DEFAULT false NOT NULL,
    "description" "text",
    "status" "public"."os_internal_key_result_status" DEFAULT 'not_started'::"public"."os_internal_key_result_status" NOT NULL,
    "current_key_result_value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internal_key_result" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_key_result_track" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_goal_id" "uuid",
    "internal_key_result_id" "uuid",
    "date" "date" NOT NULL,
    "value" numeric,
    "achieved" boolean DEFAULT false NOT NULL,
    "current_target_key_result_value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."internal_key_result_track" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_project" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "order" integer,
    "start_date_real" "date",
    "end_date_real" "date",
    "start_date_estimated" "date",
    "end_date_estimated" "date",
    "description" "text",
    "real_time" numeric,
    "estimated_time" numeric,
    "status" "public"."os_internal_project_status" DEFAULT 'not_started'::"public"."os_internal_project_status" NOT NULL,
    "sector" "public"."os_company_sector",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "internal_key_result_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internal_project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_project_task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_project_id" "uuid",
    "internal_goal_id" "uuid",
    "internal_key_result_id" "uuid",
    "name" "text" NOT NULL,
    "order" integer,
    "real_start_date" "date",
    "real_end_date" "date",
    "estimated_start_date" "date",
    "estimated_end_date" "date",
    "description" "text",
    "real_time" numeric,
    "estimated_time" numeric,
    "status" "public"."os_internal_task_status" DEFAULT 'not_started'::"public"."os_internal_task_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assignees" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internal_project_task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_project_task_comment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_task_id" "uuid" NOT NULL,
    "internal_project_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "message" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internal_project_task_comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_project_task_time_track" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignee_id" "uuid" NOT NULL,
    "internal_task_id" "uuid",
    "internal_project_id" "uuid",
    "start_date" "date",
    "start_time_min" integer,
    "end_time_min" integer,
    "time_spent_h" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."internal_project_task_time_track" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_ad_campaign" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "landing_id" "uuid",
    "platform" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "budget_cents" integer DEFAULT 0 NOT NULL,
    "spend_cents" integer DEFAULT 0 NOT NULL,
    "targeting_notes" "text",
    "utm_campaign" "text" NOT NULL,
    "ad_creative" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mkt_ad_campaign_platform_check" CHECK (("platform" = ANY (ARRAY['meta'::"text", 'google'::"text", 'linkedin'::"text"]))),
    CONSTRAINT "mkt_ad_campaign_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'live'::"text", 'paused'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."mkt_ad_campaign" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_campaign" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel" "public"."mkt_channel" DEFAULT 'email'::"public"."mkt_channel" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_campaign" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channels" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "body" "text",
    "media_url" "text",
    "status" "public"."mkt_content_status" DEFAULT 'draft'::"public"."mkt_content_status" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "posted_at" timestamp with time zone,
    "external_post_ids" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ai_generated" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "media_urls" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_decision_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "verdict" "public"."mkt_validation_status" NOT NULL,
    "rationale" "text" NOT NULL,
    "metrics_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mkt_decision_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landing_id" "uuid",
    "type" "text" NOT NULL,
    "session_id" "text",
    "utm" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_interview" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "prospect_id" "uuid",
    "participant_name" "text",
    "participant_role" "text",
    "segment" "text",
    "source" "text" DEFAULT 'network'::"text" NOT NULL,
    "conducted_at" timestamp with time zone,
    "recording_url" "text",
    "transcript" "text",
    "consent" boolean DEFAULT false NOT NULL,
    "analysis" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "analyzed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mkt_interview_source_check" CHECK (("source" = ANY (ARRAY['outreach'::"text", 'network'::"text", 'panel'::"text", 'inbound'::"text", 'booking'::"text"])))
);


ALTER TABLE "public"."mkt_interview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_landing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text",
    "capture_stages" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "published" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "code_html" "text",
    "idea_id" "uuid" NOT NULL,
    "quiz_schema" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "survey_url" "text"
);


ALTER TABLE "public"."mkt_landing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_outreach" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prospect_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "step_order" integer DEFAULT 0 NOT NULL,
    "status" "public"."mkt_outreach_status" DEFAULT 'queued'::"public"."mkt_outreach_status" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "replied_at" timestamp with time zone,
    "brevo_message_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "reply_sentiment" "text",
    CONSTRAINT "mkt_outreach_reply_sentiment_check" CHECK ((("reply_sentiment" = ANY (ARRAY['positive'::"text", 'neutral'::"text", 'negative'::"text", 'meeting_request'::"text"])) OR ("reply_sentiment" IS NULL)))
);


ALTER TABLE "public"."mkt_outreach" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_prospect" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text",
    "company" "text",
    "title" "text",
    "linkedin_url" "text",
    "source" "text",
    "enrichment" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "score" numeric,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_run_id" "uuid",
    "idea_id" "uuid" NOT NULL,
    "segment" "text"
);


ALTER TABLE "public"."mkt_prospect" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_research_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_key" "text" NOT NULL,
    "digest" "text" DEFAULT ''::"text" NOT NULL,
    "raw" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scraped_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_research_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_sequence_step" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "step_order" integer DEFAULT 0 NOT NULL,
    "delay_days" integer DEFAULT 0 NOT NULL,
    "subject_tpl" "text",
    "body_tpl" "text",
    "ai_personalise" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_sequence_step" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_signal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landing_id" "uuid",
    "type" "public"."mkt_signal_type" NOT NULL,
    "email" "text",
    "name" "text",
    "quiz_answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "stripe_session_id" "text",
    "amount_cents" integer,
    "utm" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "verified_at" timestamp with time zone,
    "survey_answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "icp_fit" boolean
);


ALTER TABLE "public"."mkt_signal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_source_run" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel" "public"."mkt_channel" NOT NULL,
    "query" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "result_count" integer DEFAULT 0 NOT NULL,
    "apify_dataset_ref" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_source_run" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_suppression" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idea_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mkt_suppression" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mkt_validation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_mode" "public"."mkt_funnel_mode" DEFAULT 'b2b_outreach'::"public"."mkt_funnel_mode" NOT NULL,
    "status" "public"."mkt_validation_status" DEFAULT 'validating'::"public"."mkt_validation_status" NOT NULL,
    "positioning" "text",
    "icp_definition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enabled_capture_stages" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reference_sources" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "decision_contract" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "booking_url" "text"
);


ALTER TABLE "public"."mkt_validation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."private_chatbot" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New chat'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."private_chatbot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."private_chatbot_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chatbot_id" "uuid" NOT NULL,
    "author_type" "public"."os_message_author_type" NOT NULL,
    "message" "text" NOT NULL,
    "tool_calls" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."private_chatbot_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "picture" "text",
    "type" "public"."os_user_type",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signature" "text",
    "theme" "public"."os_theme_choice" DEFAULT 'dark'::"public"."os_theme_choice" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "picture" "text",
    "price" numeric,
    "profit" numeric,
    "referrer_commission" numeric,
    "referrer_revenue" numeric,
    "start_date_real" "date",
    "end_date_real" "date",
    "start_date_estimated" "date",
    "end_date_estimated" "date",
    "description" "text",
    "real_time" numeric,
    "estimated_time" numeric,
    "referrer_id" "uuid",
    "authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "stage" "public"."os_project_stage",
    "program" "public"."os_project_program",
    "status" "public"."os_project_status" DEFAULT 'prospecting'::"public"."os_project_status" NOT NULL,
    "change_automatically_project_estimated_time" boolean DEFAULT false NOT NULL,
    "change_automatically_milestone_estimated_time" boolean DEFAULT false NOT NULL,
    "change_automatically_project_start_end_dates" boolean DEFAULT false NOT NULL,
    "change_automatically_milestone_start_end_dates" boolean DEFAULT false NOT NULL,
    "company_that_recommended_id" "uuid",
    "talent_who_recommended_id" "uuid",
    "client_who_recommended_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_developer_estimated_time" numeric,
    "client_developer_real_time" numeric,
    "qa_developer_estimated_time" numeric,
    "qa_developer_real_time" numeric,
    "qa_tester_estimated_time" numeric,
    "qa_tester_real_time" numeric,
    "recommended_by" "public"."os_recommended_by",
    "external_conversation_authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "internal_conversation_authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_agreement_version" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "name" "text",
    "content" "text",
    "status" "public"."os_agreement_status" DEFAULT 'not_available'::"public"."os_agreement_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "signed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "required_signers" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "google_docs_url" "text"
);


ALTER TABLE "public"."project_agreement_version" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_chatbot_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "author_type" "public"."os_message_author_type" DEFAULT 'user'::"public"."os_message_author_type" NOT NULL,
    "message" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tool_calls" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_chatbot_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_daily_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "date" "date" NOT NULL,
    "blockers" "text",
    "video_and_links" "text",
    "today_work" "text",
    "tomorrow_work" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."project_daily_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_file" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."project_file" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_internal_chatbot_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "author_type" "public"."os_message_author_type" DEFAULT 'user'::"public"."os_message_author_type" NOT NULL,
    "message" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tool_calls" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_internal_chatbot_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_invoice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "company_or_user_name" "text",
    "document_number" "text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "client_name" "text",
    "service_price" numeric(14,2),
    "due_date" "date",
    "service_title" "text",
    "service_description" "text",
    "swift_code" "text",
    "iban_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_invoice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_link" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."project_link" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_playbook_comment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "playbook_id" "uuid" NOT NULL,
    "message" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."os_playbook_comment_status" DEFAULT 'pending'::"public"."os_playbook_comment_status" NOT NULL
);


ALTER TABLE "public"."project_playbook_comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_playbook_comment_reply" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "playbook_id" "uuid" NOT NULL,
    "project_playbook_comment_id" "uuid" NOT NULL,
    "message" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_playbook_comment_reply" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_playbook_version" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "version_name" "text",
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "google_docs_url" "text"
);


ALTER TABLE "public"."project_playbook_version" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_qa_time_track" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignee_id" "uuid",
    "task_id" "uuid",
    "project_id" "uuid",
    "start_date" "date",
    "start_time_min" integer,
    "end_time_min" integer,
    "time_spent_h" numeric,
    "paid" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_qa_time_track" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "parent_task_id" "uuid",
    "name" "text",
    "order" numeric,
    "start_date_estimated" "date",
    "end_date_estimated" "date",
    "start_date_real" "date",
    "end_date_real" "date",
    "description" "text",
    "real_time" numeric,
    "estimated_time" numeric,
    "priority_level" integer,
    "type" "public"."os_task_type",
    "level" "public"."os_task_level",
    "status" "public"."os_task_status" DEFAULT 'not_started'::"public"."os_task_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assignees" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."project_task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_task_comment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "message" "text",
    "viewed_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_task_comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_task_time_track" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignee_id" "uuid",
    "task_id" "uuid",
    "project_id" "uuid",
    "start_date" "date",
    "start_time_min" integer,
    "end_time_min" integer,
    "time_spent_h" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_task_time_track" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_video" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "url" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."project_video" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "group" bigint NOT NULL,
    "name" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "created_by" "uuid"
);


ALTER TABLE "public"."prompt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_group" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."prompt_group" OWNER TO "postgres";


ALTER TABLE "public"."prompt_group" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."prompt_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sop" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "order" integer,
    "authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "authorized_user_types" "public"."os_user_type"[] DEFAULT '{}'::"public"."os_user_type"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tags" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."sop" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sop_tag" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sop_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sop_version" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sop_id" "uuid" NOT NULL,
    "version_name" "text" NOT NULL,
    "content" "text",
    "authorized_users" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "authorized_user_types" "public"."os_user_type"[] DEFAULT '{}'::"public"."os_user_type"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sop_version" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."talent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "name" "text",
    "email" "text",
    "phone" "text",
    "linkedin" "text",
    "picture" "text",
    "portfolio" "text",
    "user_account_id" "uuid",
    "country" "text",
    "current_job_position" "text",
    "level" "public"."os_talent_level",
    "current_company_id" "uuid",
    "referred_by_id" "uuid",
    "authority_level" "public"."os_talent_authority_level",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "code_expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."talent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."talent_programming_language" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "talent_id" "uuid" NOT NULL,
    "programming_language" "public"."os_programming_language",
    "score" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."talent_programming_language" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."talent_referred_by" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "score" numeric,
    "description" "text",
    "talent_id" "uuid",
    "level" "public"."os_talent_level",
    "referred_by_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."talent_referred_by" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."talent_tool" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "talent_id" "uuid" NOT NULL,
    "tool" "public"."os_tool",
    "score" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."talent_tool" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ai_settings" (
    "owner_id" "uuid" NOT NULL,
    "active_service" "public"."os_ai_service",
    "openai_api_key" "text",
    "gemini_api_key" "text",
    "claude_api_key" "text",
    "openai_model" "text" DEFAULT 'gpt-4.1'::"text",
    "gemini_model" "text" DEFAULT 'gemini-2.5-flash'::"text",
    "claude_model" "text" DEFAULT 'claude-sonnet-4-20250514'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "use_agency_settings" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."user_ai_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agency_ai_settings"
    ADD CONSTRAINT "agency_ai_settings_pkey" PRIMARY KEY ("agency_id");



ALTER TABLE ONLY "public"."agency"
    ADD CONSTRAINT "agency_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_who_referred_this_talent"
    ADD CONSTRAINT "client_who_referred_this_talent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_internal_project_message"
    ADD CONSTRAINT "conversation_internal_project_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_internal_project_message_thread"
    ADD CONSTRAINT "conversation_internal_project_message_thread_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_project_external_message"
    ADD CONSTRAINT "external_conversation_project_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_project_external_message_thread"
    ADD CONSTRAINT "external_conversation_project_message_thread_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_benchmarking"
    ADD CONSTRAINT "idea_benchmarking_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_benchmarking"
    ADD CONSTRAINT "idea_benchmarking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_product_definition_and_flows"
    ADD CONSTRAINT "idea_block_product_definition_and_flows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_structure_and_align"
    ADD CONSTRAINT "idea_block_structure_and_align_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_chatbot_devil_advocate"
    ADD CONSTRAINT "idea_chatbot_devil_advocate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_chatbot"
    ADD CONSTRAINT "idea_chatbot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_database"
    ADD CONSTRAINT "idea_database_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_database"
    ADD CONSTRAINT "idea_database_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_icp"
    ADD CONSTRAINT "idea_icp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_milestones_and_tasks"
    ADD CONSTRAINT "idea_milestones_and_tasks_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_milestones_and_tasks"
    ADD CONSTRAINT "idea_milestones_and_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_optimization_suggestion"
    ADD CONSTRAINT "idea_optimization_suggestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea"
    ADD CONSTRAINT "idea_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_prd"
    ADD CONSTRAINT "idea_prd_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_prd"
    ADD CONSTRAINT "idea_prd_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_report"
    ADD CONSTRAINT "idea_report_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_report"
    ADD CONSTRAINT "idea_report_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_styles"
    ADD CONSTRAINT "idea_styles_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_styles"
    ADD CONSTRAINT "idea_styles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_project_internal_message"
    ADD CONSTRAINT "internal_conversation_project_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_project_internal_message_thread"
    ADD CONSTRAINT "internal_conversation_project_message_thread_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_goal"
    ADD CONSTRAINT "internal_goal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_key_result"
    ADD CONSTRAINT "internal_key_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_key_result_track"
    ADD CONSTRAINT "internal_key_result_track_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_project"
    ADD CONSTRAINT "internal_project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_project_task_comment"
    ADD CONSTRAINT "internal_task_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_project_task"
    ADD CONSTRAINT "internal_task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_project_task_time_track"
    ADD CONSTRAINT "internal_time_track_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_ad_campaign"
    ADD CONSTRAINT "mkt_ad_campaign_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_ad_campaign"
    ADD CONSTRAINT "mkt_ad_campaign_utm_campaign_key" UNIQUE ("utm_campaign");



ALTER TABLE ONLY "public"."mkt_campaign"
    ADD CONSTRAINT "mkt_campaign_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_content"
    ADD CONSTRAINT "mkt_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_decision_log"
    ADD CONSTRAINT "mkt_decision_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_event"
    ADD CONSTRAINT "mkt_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_interview"
    ADD CONSTRAINT "mkt_interview_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_landing"
    ADD CONSTRAINT "mkt_landing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_landing"
    ADD CONSTRAINT "mkt_landing_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."mkt_outreach"
    ADD CONSTRAINT "mkt_outreach_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_prospect"
    ADD CONSTRAINT "mkt_prospect_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_research_cache"
    ADD CONSTRAINT "mkt_research_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_sequence_step"
    ADD CONSTRAINT "mkt_sequence_step_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_signal"
    ADD CONSTRAINT "mkt_signal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_source_run"
    ADD CONSTRAINT "mkt_source_run_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_suppression"
    ADD CONSTRAINT "mkt_suppression_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mkt_validation"
    ADD CONSTRAINT "mkt_validation_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."mkt_validation"
    ADD CONSTRAINT "mkt_validation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_chatbot_message"
    ADD CONSTRAINT "private_chatbot_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_chatbot"
    ADD CONSTRAINT "private_chatbot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_private_message"
    ADD CONSTRAINT "private_conversation_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_private_message_thread"
    ADD CONSTRAINT "private_conversation_message_thread_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_private"
    ADD CONSTRAINT "private_conversation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agreement_template"
    ADD CONSTRAINT "project_agreement_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_agreement_version"
    ADD CONSTRAINT "project_agreement_version_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_chatbot_message"
    ADD CONSTRAINT "project_chatbot_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_daily_feedback"
    ADD CONSTRAINT "project_daily_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_file"
    ADD CONSTRAINT "project_file_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_internal_chatbot_message"
    ADD CONSTRAINT "project_internal_chatbot_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_invoice"
    ADD CONSTRAINT "project_invoice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_link"
    ADD CONSTRAINT "project_link_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_playbook_comment"
    ADD CONSTRAINT "project_playbook_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_playbook_comment_reply"
    ADD CONSTRAINT "project_playbook_comment_reply_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_playbook_version"
    ADD CONSTRAINT "project_playbook_version_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_video"
    ADD CONSTRAINT "project_video_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_group"
    ADD CONSTRAINT "prompt_group_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt"
    ADD CONSTRAINT "prompt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_qa_time_track"
    ADD CONSTRAINT "qa_time_track_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sop"
    ADD CONSTRAINT "sop_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sop_tag"
    ADD CONSTRAINT "sop_tag_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sop_version"
    ADD CONSTRAINT "sop_version_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."talent_programming_language"
    ADD CONSTRAINT "talent_programming_language_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."talent_referred_by"
    ADD CONSTRAINT "talent_referred_by_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."talent_tool"
    ADD CONSTRAINT "talent_tool_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_task_comment"
    ADD CONSTRAINT "task_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_task"
    ADD CONSTRAINT "task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_task_time_track"
    ADD CONSTRAINT "time_track_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_settings"
    ADD CONSTRAINT "user_ai_settings_pkey" PRIMARY KEY ("owner_id");



CREATE INDEX "conv_int_proj_msg_proj_idx" ON "public"."conversation_internal_project_message" USING "btree" ("internal_project_id", "created_at" DESC);



CREATE INDEX "conv_int_proj_msg_thread_parent_idx" ON "public"."conversation_internal_project_message_thread" USING "btree" ("parent_id", "created_at");



CREATE INDEX "conv_int_proj_msg_thread_viewed_by_idx" ON "public"."conversation_internal_project_message_thread" USING "gin" ("viewed_by");



CREATE INDEX "conv_int_proj_msg_viewed_by_idx" ON "public"."conversation_internal_project_message" USING "gin" ("viewed_by");



CREATE INDEX "ext_conv_proj_msg_proj_idx" ON "public"."conversation_project_external_message" USING "btree" ("project_id", "created_at" DESC);



CREATE INDEX "ext_conv_proj_msg_thread_parent_idx" ON "public"."conversation_project_external_message_thread" USING "btree" ("parent_id", "created_at");



CREATE INDEX "ext_proj_msg_thread_viewed_by_idx" ON "public"."conversation_project_external_message_thread" USING "gin" ("viewed_by");



CREATE INDEX "ext_proj_msg_viewed_by_idx" ON "public"."conversation_project_external_message" USING "gin" ("viewed_by");



CREATE INDEX "idea_chatbot_devil_advocate_idea_idx" ON "public"."idea_chatbot_devil_advocate" USING "btree" ("idea_id");



CREATE INDEX "idea_chatbot_idea_id_created_at_idx" ON "public"."idea_chatbot" USING "btree" ("idea_id", "created_at");



CREATE INDEX "idea_icp_idea_id_idx" ON "public"."idea_icp" USING "btree" ("idea_id");



CREATE INDEX "idea_project_id_idx" ON "public"."idea" USING "btree" ("project_id");



CREATE INDEX "idx_idea_project_id" ON "public"."idea" USING "btree" ("project_id");



CREATE INDEX "idx_project_agreement_v_project_id" ON "public"."project_agreement_version" USING "btree" ("project_id");



CREATE INDEX "idx_project_daily_feedback_project_id" ON "public"."project_daily_feedback" USING "btree" ("project_id");



CREATE INDEX "idx_project_file_project_id" ON "public"."project_file" USING "btree" ("project_id");



CREATE INDEX "idx_project_invoice_created_by" ON "public"."project_invoice" USING "btree" ("created_by");



CREATE INDEX "idx_project_invoice_project_id" ON "public"."project_invoice" USING "btree" ("project_id");



CREATE INDEX "idx_project_link_project_id" ON "public"."project_link" USING "btree" ("project_id");



CREATE INDEX "idx_project_playbook_comment_playbook" ON "public"."project_playbook_comment" USING "btree" ("playbook_id");



CREATE INDEX "idx_project_playbook_comment_reply_comment" ON "public"."project_playbook_comment_reply" USING "btree" ("project_playbook_comment_id");



CREATE INDEX "idx_project_playbook_v_project_id" ON "public"."project_playbook_version" USING "btree" ("project_id");



CREATE INDEX "idx_project_video_project_id" ON "public"."project_video" USING "btree" ("project_id");



CREATE INDEX "idx_qa_time_track_project_id" ON "public"."project_qa_time_track" USING "btree" ("project_id");



CREATE INDEX "idx_task_comment_project_id" ON "public"."project_task_comment" USING "btree" ("project_id");



CREATE INDEX "idx_task_project_id" ON "public"."project_task" USING "btree" ("project_id");



CREATE INDEX "idx_time_track_project_id" ON "public"."project_task_time_track" USING "btree" ("project_id");



CREATE INDEX "int_conv_proj_msg_proj_idx" ON "public"."conversation_project_internal_message" USING "btree" ("project_id", "created_at" DESC);



CREATE INDEX "int_conv_proj_msg_thread_parent_idx" ON "public"."conversation_project_internal_message_thread" USING "btree" ("parent_id", "created_at");



CREATE INDEX "int_proj_msg_thread_viewed_by_idx" ON "public"."conversation_project_internal_message_thread" USING "gin" ("viewed_by");



CREATE INDEX "int_proj_msg_viewed_by_idx" ON "public"."conversation_project_internal_message" USING "gin" ("viewed_by");



CREATE INDEX "internal_key_result_goal_idx" ON "public"."internal_key_result" USING "btree" ("internal_goal_id");



CREATE INDEX "internal_key_result_internal_goal_id_idx" ON "public"."internal_key_result" USING "btree" ("internal_goal_id");



CREATE INDEX "internal_key_result_track_kr_idx" ON "public"."internal_key_result_track" USING "btree" ("internal_key_result_id", "date");



CREATE INDEX "internal_task_internal_goal_id_idx" ON "public"."internal_project_task" USING "btree" ("internal_goal_id");



CREATE INDEX "internal_task_internal_project_id_idx" ON "public"."internal_project_task" USING "btree" ("internal_project_id");



CREATE INDEX "mkt_ad_campaign_idea_idx" ON "public"."mkt_ad_campaign" USING "btree" ("idea_id");



CREATE INDEX "mkt_content_due_idx" ON "public"."mkt_content" USING "btree" ("status", "scheduled_at");



CREATE INDEX "mkt_decision_log_idea_idx" ON "public"."mkt_decision_log" USING "btree" ("idea_id");



CREATE INDEX "mkt_interview_idea_idx" ON "public"."mkt_interview" USING "btree" ("idea_id");



CREATE INDEX "mkt_outreach_due_idx" ON "public"."mkt_outreach" USING "btree" ("status", "scheduled_at");



CREATE INDEX "mkt_prospect_source_run_id_idx" ON "public"."mkt_prospect" USING "btree" ("source_run_id") WHERE ("source_run_id" IS NOT NULL);



CREATE UNIQUE INDEX "mkt_research_cache_idea_source_key" ON "public"."mkt_research_cache" USING "btree" ("idea_id", "source_key");



CREATE INDEX "mkt_sequence_step_campaign_idx" ON "public"."mkt_sequence_step" USING "btree" ("campaign_id", "step_order");



CREATE INDEX "priv_chatbot_msg_chatbot_idx" ON "public"."private_chatbot_message" USING "btree" ("chatbot_id", "created_at");



CREATE INDEX "priv_chatbot_owner_idx" ON "public"."private_chatbot" USING "btree" ("created_by", "updated_at" DESC);



CREATE INDEX "priv_conv_msg_conv_idx" ON "public"."conversation_private_message" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "priv_conv_msg_thread_parent_idx" ON "public"."conversation_private_message_thread" USING "btree" ("parent_id", "created_at");



CREATE INDEX "priv_conv_msg_thread_viewed_by_idx" ON "public"."conversation_private_message_thread" USING "gin" ("viewed_by");



CREATE INDEX "priv_conv_msg_viewed_by_idx" ON "public"."conversation_private_message" USING "gin" ("viewed_by");



CREATE INDEX "priv_conv_participants_idx" ON "public"."conversation_private" USING "gin" ("participant_user_ids");



CREATE INDEX "project_authorized_users_idx" ON "public"."project" USING "gin" ("authorized_users");



CREATE INDEX "project_chatbot_message_project_idx" ON "public"."project_chatbot_message" USING "btree" ("project_id", "created_at");



CREATE INDEX "project_ext_conv_auth_idx" ON "public"."project" USING "gin" ("external_conversation_authorized_users");



CREATE INDEX "project_int_conv_auth_idx" ON "public"."project" USING "gin" ("internal_conversation_authorized_users");



CREATE INDEX "project_internal_chatbot_message_project_idx" ON "public"."project_internal_chatbot_message" USING "btree" ("project_id", "created_at");



CREATE INDEX "project_referrer_id_idx" ON "public"."project" USING "btree" ("referrer_id");



CREATE INDEX "project_status_idx" ON "public"."project" USING "btree" ("status");



CREATE INDEX "qa_time_track_project_id_idx" ON "public"."project_qa_time_track" USING "btree" ("project_id");



CREATE INDEX "sop_authorized_user_types_idx" ON "public"."sop" USING "gin" ("authorized_user_types");



CREATE INDEX "sop_authorized_users_idx" ON "public"."sop" USING "gin" ("authorized_users");



CREATE INDEX "sop_version_authorized_users_idx" ON "public"."sop_version" USING "gin" ("authorized_users");



CREATE INDEX "sop_version_sop_id_idx" ON "public"."sop_version" USING "btree" ("sop_id");



CREATE INDEX "talent_code_active_idx" ON "public"."talent" USING "btree" ("code") WHERE (("code" IS NOT NULL) AND ("code_expires_at" IS NOT NULL));



CREATE INDEX "talent_code_idx" ON "public"."talent" USING "btree" ("code");



CREATE INDEX "talent_user_account_id_idx" ON "public"."talent" USING "btree" ("user_account_id");



CREATE INDEX "task_parent_task_id_idx" ON "public"."project_task" USING "btree" ("parent_task_id");



CREATE INDEX "task_project_id_idx" ON "public"."project_task" USING "btree" ("project_id");



CREATE INDEX "time_track_owner_id_idx" ON "public"."project_task_time_track" USING "btree" ("assignee_id");



CREATE INDEX "time_track_project_id_idx" ON "public"."project_task_time_track" USING "btree" ("project_id");



CREATE OR REPLACE TRIGGER "idea_set_version_name" BEFORE INSERT ON "public"."idea" FOR EACH ROW WHEN (("new"."version_name" IS NULL)) EXECUTE FUNCTION "public"."idea_auto_version_name"();



CREATE OR REPLACE TRIGGER "idea_update_version_name" BEFORE UPDATE ON "public"."idea" FOR EACH ROW EXECUTE FUNCTION "public"."idea_update_version_on_project_change"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "project_chatbot_message_touch" BEFORE UPDATE ON "public"."project_chatbot_message" FOR EACH ROW EXECUTE FUNCTION "public"."touch_project_chatbot_updated_at"();



CREATE OR REPLACE TRIGGER "project_fill_conversation_users" BEFORE INSERT ON "public"."project" FOR EACH ROW EXECUTE FUNCTION "public"."fill_project_conversation_users"();



CREATE OR REPLACE TRIGGER "project_internal_chatbot_message_touch" BEFORE UPDATE ON "public"."project_internal_chatbot_message" FOR EACH ROW EXECUTE FUNCTION "public"."touch_project_chatbot_updated_at"();



CREATE OR REPLACE TRIGGER "project_invoice_set_updated_at" BEFORE UPDATE ON "public"."project_invoice" FOR EACH ROW EXECUTE FUNCTION "public"."project_invoice_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."agency" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."agency_ai_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."client_who_referred_this_talent" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_internal_project_message" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_internal_project_message_thread" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_private" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_private_message" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_private_message_thread" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_project_external_message" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_project_external_message_thread" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_project_internal_message" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_project_internal_message_thread" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."idea" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."idea_icp" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."idea_optimization_suggestion" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."idea_product_definition_and_flows" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."idea_structure_and_align" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."internal_project" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."internal_project_task" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."internal_project_task_comment" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."internal_project_task_time_track" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."private_chatbot_message" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_qa_time_track" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_task" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_task_comment" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."project_task_time_track" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."prompt_group" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."sop" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."sop_tag" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."sop_version" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."talent_referred_by" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_ai_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_benchmarking" BEFORE UPDATE ON "public"."idea_benchmarking" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_chatbot" BEFORE UPDATE ON "public"."idea_chatbot" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_database" BEFORE UPDATE ON "public"."idea_database" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_milestones" BEFORE UPDATE ON "public"."idea_milestones_and_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_prd" BEFORE UPDATE ON "public"."idea_prd" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_report" BEFORE UPDATE ON "public"."idea_report" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_idea_styles" BEFORE UPDATE ON "public"."idea_styles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_campaign" BEFORE UPDATE ON "public"."mkt_campaign" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_content" BEFORE UPDATE ON "public"."mkt_content" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_landing" BEFORE UPDATE ON "public"."mkt_landing" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_outreach" BEFORE UPDATE ON "public"."mkt_outreach" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_prospect" BEFORE UPDATE ON "public"."mkt_prospect" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_sequence_step" BEFORE UPDATE ON "public"."mkt_sequence_step" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_source_run" BEFORE UPDATE ON "public"."mkt_source_run" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_mkt_validation" BEFORE UPDATE ON "public"."mkt_validation" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_private_chatbot" BEFORE UPDATE ON "public"."private_chatbot" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_prompt" BEFORE UPDATE ON "public"."prompt" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "talent_updated_at" BEFORE UPDATE ON "public"."talent" FOR EACH ROW EXECUTE FUNCTION "public"."talent_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_feedback_updated_at" BEFORE UPDATE ON "public"."feedback" FOR EACH ROW EXECUTE FUNCTION "public"."feedback_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_project_agreement_version_auto_complete" BEFORE INSERT OR UPDATE OF "signed_by", "required_signers", "status" ON "public"."project_agreement_version" FOR EACH ROW EXECUTE FUNCTION "public"."project_agreement_version_auto_complete"();



ALTER TABLE ONLY "public"."agency_ai_settings"
    ADD CONSTRAINT "agency_ai_settings_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agency"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agency"
    ADD CONSTRAINT "agency_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_who_referred_this_talent"
    ADD CONSTRAINT "client_who_referred_this_talent_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_who_referred_this_talent"
    ADD CONSTRAINT "client_who_referred_this_talent_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_who_referred_this_talent"
    ADD CONSTRAINT "client_who_referred_this_talent_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_internal_project_message_thread"
    ADD CONSTRAINT "conversation_internal_project_message__internal_project_id_fkey" FOREIGN KEY ("internal_project_id") REFERENCES "public"."internal_project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_internal_project_message"
    ADD CONSTRAINT "conversation_internal_project_message_internal_project_id_fkey" FOREIGN KEY ("internal_project_id") REFERENCES "public"."internal_project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_internal_project_message"
    ADD CONSTRAINT "conversation_internal_project_message_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_internal_project_message_thread"
    ADD CONSTRAINT "conversation_internal_project_message_thread_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_internal_project_message_thread"
    ADD CONSTRAINT "conversation_internal_project_message_thread_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."conversation_internal_project_message"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_external_message"
    ADD CONSTRAINT "external_conversation_project_message_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_external_message"
    ADD CONSTRAINT "external_conversation_project_message_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_external_message_thread"
    ADD CONSTRAINT "external_conversation_project_message_thread_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_external_message_thread"
    ADD CONSTRAINT "external_conversation_project_message_thread_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."conversation_project_external_message"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_external_message_thread"
    ADD CONSTRAINT "external_conversation_project_message_thread_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_benchmarking"
    ADD CONSTRAINT "idea_benchmarking_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_benchmarking"
    ADD CONSTRAINT "idea_benchmarking_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_product_definition_and_flows"
    ADD CONSTRAINT "idea_block_product_definition_and_flows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_product_definition_and_flows"
    ADD CONSTRAINT "idea_block_product_definition_and_flows_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_structure_and_align"
    ADD CONSTRAINT "idea_block_structure_and_align_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_chatbot"
    ADD CONSTRAINT "idea_chatbot_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_chatbot_devil_advocate"
    ADD CONSTRAINT "idea_chatbot_devil_advocate_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_chatbot_devil_advocate"
    ADD CONSTRAINT "idea_chatbot_devil_advocate_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_chatbot"
    ADD CONSTRAINT "idea_chatbot_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea"
    ADD CONSTRAINT "idea_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_database"
    ADD CONSTRAINT "idea_database_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_database"
    ADD CONSTRAINT "idea_database_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_icp"
    ADD CONSTRAINT "idea_icp_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_icp"
    ADD CONSTRAINT "idea_icp_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_milestones_and_tasks"
    ADD CONSTRAINT "idea_milestones_and_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_milestones_and_tasks"
    ADD CONSTRAINT "idea_milestones_and_tasks_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_optimization_suggestion"
    ADD CONSTRAINT "idea_optimization_suggestion_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_optimization_suggestion"
    ADD CONSTRAINT "idea_optimization_suggestion_icp_id_fkey" FOREIGN KEY ("icp_id") REFERENCES "public"."idea_icp"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_optimization_suggestion"
    ADD CONSTRAINT "idea_optimization_suggestion_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_prd"
    ADD CONSTRAINT "idea_prd_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_prd"
    ADD CONSTRAINT "idea_prd_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea"
    ADD CONSTRAINT "idea_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_report"
    ADD CONSTRAINT "idea_report_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_structure_and_align"
    ADD CONSTRAINT "idea_structure_and_align_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_styles"
    ADD CONSTRAINT "idea_styles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_styles"
    ADD CONSTRAINT "idea_styles_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_internal_message"
    ADD CONSTRAINT "internal_conversation_project_message_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_internal_message"
    ADD CONSTRAINT "internal_conversation_project_message_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_internal_message_thread"
    ADD CONSTRAINT "internal_conversation_project_message_thread_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_internal_message_thread"
    ADD CONSTRAINT "internal_conversation_project_message_thread_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."conversation_project_internal_message"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_project_internal_message_thread"
    ADD CONSTRAINT "internal_conversation_project_message_thread_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."internal_goal"
    ADD CONSTRAINT "internal_goal_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_key_result"
    ADD CONSTRAINT "internal_key_result_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_key_result"
    ADD CONSTRAINT "internal_key_result_internal_goal_id_fkey" FOREIGN KEY ("internal_goal_id") REFERENCES "public"."internal_goal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_key_result_track"
    ADD CONSTRAINT "internal_key_result_track_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_key_result_track"
    ADD CONSTRAINT "internal_key_result_track_internal_goal_id_fkey" FOREIGN KEY ("internal_goal_id") REFERENCES "public"."internal_goal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_key_result_track"
    ADD CONSTRAINT "internal_key_result_track_internal_key_result_id_fkey" FOREIGN KEY ("internal_key_result_id") REFERENCES "public"."internal_key_result"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project"
    ADD CONSTRAINT "internal_project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task_comment"
    ADD CONSTRAINT "internal_task_comment_internal_project_id_fkey" FOREIGN KEY ("internal_project_id") REFERENCES "public"."internal_project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task_comment"
    ADD CONSTRAINT "internal_task_comment_internal_task_id_fkey" FOREIGN KEY ("internal_task_id") REFERENCES "public"."internal_project_task"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."internal_project_task_comment"
    ADD CONSTRAINT "internal_task_comment_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."internal_project_task"
    ADD CONSTRAINT "internal_task_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task"
    ADD CONSTRAINT "internal_task_internal_goal_id_fkey" FOREIGN KEY ("internal_goal_id") REFERENCES "public"."internal_goal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task"
    ADD CONSTRAINT "internal_task_internal_key_result_id_fkey" FOREIGN KEY ("internal_key_result_id") REFERENCES "public"."internal_key_result"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task"
    ADD CONSTRAINT "internal_task_internal_project_id_fkey" FOREIGN KEY ("internal_project_id") REFERENCES "public"."internal_project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task_time_track"
    ADD CONSTRAINT "internal_task_time_track_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task_time_track"
    ADD CONSTRAINT "internal_time_track_internal_project_id_fkey" FOREIGN KEY ("internal_project_id") REFERENCES "public"."internal_project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task_time_track"
    ADD CONSTRAINT "internal_time_track_internal_task_id_fkey" FOREIGN KEY ("internal_task_id") REFERENCES "public"."internal_project_task"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internal_project_task_time_track"
    ADD CONSTRAINT "internal_time_track_owner_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_ad_campaign"
    ADD CONSTRAINT "mkt_ad_campaign_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_ad_campaign"
    ADD CONSTRAINT "mkt_ad_campaign_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_ad_campaign"
    ADD CONSTRAINT "mkt_ad_campaign_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "public"."mkt_landing"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_campaign"
    ADD CONSTRAINT "mkt_campaign_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_campaign"
    ADD CONSTRAINT "mkt_campaign_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_content"
    ADD CONSTRAINT "mkt_content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_content"
    ADD CONSTRAINT "mkt_content_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_decision_log"
    ADD CONSTRAINT "mkt_decision_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_decision_log"
    ADD CONSTRAINT "mkt_decision_log_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_event"
    ADD CONSTRAINT "mkt_event_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_event"
    ADD CONSTRAINT "mkt_event_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "public"."mkt_landing"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_interview"
    ADD CONSTRAINT "mkt_interview_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_interview"
    ADD CONSTRAINT "mkt_interview_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_interview"
    ADD CONSTRAINT "mkt_interview_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."mkt_prospect"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_landing"
    ADD CONSTRAINT "mkt_landing_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_landing"
    ADD CONSTRAINT "mkt_landing_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_outreach"
    ADD CONSTRAINT "mkt_outreach_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mkt_campaign"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_outreach"
    ADD CONSTRAINT "mkt_outreach_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_outreach"
    ADD CONSTRAINT "mkt_outreach_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."mkt_prospect"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_prospect"
    ADD CONSTRAINT "mkt_prospect_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_prospect"
    ADD CONSTRAINT "mkt_prospect_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_prospect"
    ADD CONSTRAINT "mkt_prospect_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "public"."mkt_source_run"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_research_cache"
    ADD CONSTRAINT "mkt_research_cache_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_sequence_step"
    ADD CONSTRAINT "mkt_sequence_step_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."mkt_campaign"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_sequence_step"
    ADD CONSTRAINT "mkt_sequence_step_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_signal"
    ADD CONSTRAINT "mkt_signal_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_signal"
    ADD CONSTRAINT "mkt_signal_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "public"."mkt_landing"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_source_run"
    ADD CONSTRAINT "mkt_source_run_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_source_run"
    ADD CONSTRAINT "mkt_source_run_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_suppression"
    ADD CONSTRAINT "mkt_suppression_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mkt_validation"
    ADD CONSTRAINT "mkt_validation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mkt_validation"
    ADD CONSTRAINT "mkt_validation_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_chatbot_message"
    ADD CONSTRAINT "private_chatbot_message_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "public"."private_chatbot"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_chatbot_message"
    ADD CONSTRAINT "private_chatbot_message_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."private_chatbot"
    ADD CONSTRAINT "private_chatbot_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_private"
    ADD CONSTRAINT "private_conversation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_private_message"
    ADD CONSTRAINT "private_conversation_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation_private"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_private_message"
    ADD CONSTRAINT "private_conversation_message_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_private_message_thread"
    ADD CONSTRAINT "private_conversation_message_thread_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation_private"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_private_message_thread"
    ADD CONSTRAINT "private_conversation_message_thread_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_private_message_thread"
    ADD CONSTRAINT "private_conversation_message_thread_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."conversation_private_message"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agreement_template"
    ADD CONSTRAINT "project_agreement_template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_agreement_version"
    ADD CONSTRAINT "project_agreement_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_agreement_version"
    ADD CONSTRAINT "project_agreement_version_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_agreement_version"
    ADD CONSTRAINT "project_agreement_version_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."agreement_template"("id");



ALTER TABLE ONLY "public"."project_chatbot_message"
    ADD CONSTRAINT "project_chatbot_message_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_chatbot_message"
    ADD CONSTRAINT "project_chatbot_message_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_client_who_recommended_id_fkey" FOREIGN KEY ("client_who_recommended_id") REFERENCES "public"."client"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_company_that_recommended_id_fkey" FOREIGN KEY ("company_that_recommended_id") REFERENCES "public"."company"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_daily_feedback"
    ADD CONSTRAINT "project_daily_feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_daily_feedback"
    ADD CONSTRAINT "project_daily_feedback_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_file"
    ADD CONSTRAINT "project_file_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_file"
    ADD CONSTRAINT "project_file_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_internal_chatbot_message"
    ADD CONSTRAINT "project_internal_chatbot_message_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_internal_chatbot_message"
    ADD CONSTRAINT "project_internal_chatbot_message_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_invoice"
    ADD CONSTRAINT "project_invoice_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_invoice"
    ADD CONSTRAINT "project_invoice_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_link"
    ADD CONSTRAINT "project_link_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_link"
    ADD CONSTRAINT "project_link_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment"
    ADD CONSTRAINT "project_playbook_comment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment"
    ADD CONSTRAINT "project_playbook_comment_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "public"."project_playbook_version"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment"
    ADD CONSTRAINT "project_playbook_comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment_reply"
    ADD CONSTRAINT "project_playbook_comment_reply_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment_reply"
    ADD CONSTRAINT "project_playbook_comment_reply_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "public"."project_playbook_version"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment_reply"
    ADD CONSTRAINT "project_playbook_comment_reply_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_comment_reply"
    ADD CONSTRAINT "project_playbook_comment_reply_project_playbook_comment_id_fkey" FOREIGN KEY ("project_playbook_comment_id") REFERENCES "public"."project_playbook_comment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_playbook_version"
    ADD CONSTRAINT "project_playbook_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_playbook_version"
    ADD CONSTRAINT "project_playbook_version_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_talent_who_recommended_id_fkey" FOREIGN KEY ("talent_who_recommended_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_video"
    ADD CONSTRAINT "project_video_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_video"
    ADD CONSTRAINT "project_video_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt"
    ADD CONSTRAINT "prompt_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prompt_group"
    ADD CONSTRAINT "prompt_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prompt"
    ADD CONSTRAINT "prompt_group_fkey" FOREIGN KEY ("group") REFERENCES "public"."prompt_group"("id");



ALTER TABLE ONLY "public"."project_qa_time_track"
    ADD CONSTRAINT "qa_time_track_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_qa_time_track"
    ADD CONSTRAINT "qa_time_track_owner_user_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_qa_time_track"
    ADD CONSTRAINT "qa_time_track_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_qa_time_track"
    ADD CONSTRAINT "qa_time_track_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_task"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sop"
    ADD CONSTRAINT "sop_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sop_tag"
    ADD CONSTRAINT "sop_tag_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sop_version"
    ADD CONSTRAINT "sop_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sop_version"
    ADD CONSTRAINT "sop_version_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "public"."sop"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_current_company_id_fkey" FOREIGN KEY ("current_company_id") REFERENCES "public"."company"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."talent_programming_language"
    ADD CONSTRAINT "talent_programming_language_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."talent_referred_by"
    ADD CONSTRAINT "talent_referred_by_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."talent_referred_by"
    ADD CONSTRAINT "talent_referred_by_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."talent_referred_by"
    ADD CONSTRAINT "talent_referred_by_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."talent_tool"
    ADD CONSTRAINT "talent_tool_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task_comment"
    ADD CONSTRAINT "task_comment_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_comment"
    ADD CONSTRAINT "task_comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task_comment"
    ADD CONSTRAINT "task_comment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_task"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task"
    ADD CONSTRAINT "task_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task"
    ADD CONSTRAINT "task_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "public"."project_task"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task"
    ADD CONSTRAINT "task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_time_track"
    ADD CONSTRAINT "time_track_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task_time_track"
    ADD CONSTRAINT "time_track_owner_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_time_track"
    ADD CONSTRAINT "time_track_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task_time_track"
    ADD CONSTRAINT "time_track_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_task"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_ai_settings"
    ADD CONSTRAINT "user_ai_settings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."agency" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agency: admin write" ON "public"."agency" USING ((( SELECT "profiles"."type"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"public"."os_user_type")) WITH CHECK ((( SELECT "profiles"."type"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"public"."os_user_type"));



CREATE POLICY "agency: any authed read" ON "public"."agency" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."agency_ai_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agency_ai_settings: admin/manager read" ON "public"."agency_ai_settings" FOR SELECT USING ("public"."is_admin_or_manager"());



CREATE POLICY "agency_ai_settings: admin/manager write" ON "public"."agency_ai_settings" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



ALTER TABLE "public"."agreement_template" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agreement_template: admin/manager all" ON "public"."agreement_template" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



ALTER TABLE "public"."client" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client: staff all" ON "public"."client" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."client_who_referred_this_talent" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_who_referred_this_talent: staff all" ON "public"."client_who_referred_this_talent" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."company" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company: admin/manager all" ON "public"."company" USING ("public"."is_admin_or_manager"());



CREATE POLICY "company: operational read" ON "public"."company" FOR SELECT USING (("public"."get_user_type"() = 'operational'::"public"."os_user_type"));



CREATE POLICY "company: staff all" ON "public"."company" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "conv_int_proj_msg: delete_own" ON "public"."conversation_internal_project_message" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "conv_int_proj_msg: insert" ON "public"."conversation_internal_project_message" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND ("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))));



CREATE POLICY "conv_int_proj_msg: select" ON "public"."conversation_internal_project_message" FOR SELECT TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "conv_int_proj_msg: update_own" ON "public"."conversation_internal_project_message" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "conv_int_proj_msg_thread: delete_own" ON "public"."conversation_internal_project_message_thread" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "conv_int_proj_msg_thread: insert" ON "public"."conversation_internal_project_message_thread" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND ("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))));



CREATE POLICY "conv_int_proj_msg_thread: select" ON "public"."conversation_internal_project_message_thread" FOR SELECT TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "conv_int_proj_msg_thread: update_own" ON "public"."conversation_internal_project_message_thread" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."conversation_internal_project_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_internal_project_message_thread" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_private" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_private_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_private_message_thread" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_project_external_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_project_external_message_thread" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_project_internal_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_project_internal_message_thread" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cwrtt: code-present read" ON "public"."client_who_referred_this_talent" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("code" IS NOT NULL)));



CREATE POLICY "ext_conv_proj_msg: delete_own" ON "public"."conversation_project_external_message" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "ext_conv_proj_msg: insert" ON "public"."conversation_project_external_message" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND ("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."external_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_external_message"."project_id"))))));



CREATE POLICY "ext_conv_proj_msg: select" ON "public"."conversation_project_external_message" FOR SELECT USING (("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."external_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_external_message"."project_id")))));



CREATE POLICY "ext_conv_proj_msg: update_own" ON "public"."conversation_project_external_message" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "ext_conv_proj_msg_thread: delete_own" ON "public"."conversation_project_external_message_thread" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "ext_conv_proj_msg_thread: insert" ON "public"."conversation_project_external_message_thread" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND ("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."external_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_external_message_thread"."project_id"))))));



CREATE POLICY "ext_conv_proj_msg_thread: select" ON "public"."conversation_project_external_message_thread" FOR SELECT USING (("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."external_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_external_message_thread"."project_id")))));



CREATE POLICY "ext_conv_proj_msg_thread: update_own" ON "public"."conversation_project_external_message_thread" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feedback: admin/manager all" ON "public"."feedback" USING ("public"."is_admin_or_manager"());



CREATE POLICY "feedback: own delete" ON "public"."feedback" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "feedback: own insert" ON "public"."feedback" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "feedback: own update" ON "public"."feedback" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "feedback: role-based read" ON "public"."feedback" FOR SELECT USING ((("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])) OR ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."idea" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea: admin/manager all" ON "public"."idea" USING ("public"."is_admin_or_manager"());



CREATE POLICY "idea: owner all" ON "public"."idea" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "idea: project authorized user read" ON "public"."idea" FOR SELECT USING ((("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "idea"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



ALTER TABLE "public"."idea_benchmarking" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_benchmarking_all" ON "public"."idea_benchmarking" USING (true) WITH CHECK (true);



ALTER TABLE "public"."idea_chatbot" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_chatbot_all" ON "public"."idea_chatbot" USING (true) WITH CHECK (true);



ALTER TABLE "public"."idea_chatbot_devil_advocate" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_chatbot_devil_advocate: admin/manager all" ON "public"."idea_chatbot_devil_advocate" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "idea_chatbot_devil_advocate: creator all" ON "public"."idea_chatbot_devil_advocate" USING ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_chatbot_devil_advocate"."idea_id") AND ("i"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_chatbot_devil_advocate"."idea_id") AND ("i"."created_by" = "auth"."uid"())))));



CREATE POLICY "idea_chatbot_devil_advocate: project authorized user all" ON "public"."idea_chatbot_devil_advocate" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_chatbot_devil_advocate"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_chatbot_devil_advocate"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."idea_database" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_database_all" ON "public"."idea_database" USING (true) WITH CHECK (true);



ALTER TABLE "public"."idea_icp" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_icp: admin/manager all" ON "public"."idea_icp" USING ("public"."is_admin_or_manager"());



CREATE POLICY "idea_icp: creator all" ON "public"."idea_icp" USING ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_icp"."idea_id") AND ("i"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_icp"."idea_id") AND ("i"."created_by" = "auth"."uid"())))));



CREATE POLICY "idea_icp: project authorized user read" ON "public"."idea_icp" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_icp"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "idea_milestones_all" ON "public"."idea_milestones_and_tasks" USING (true) WITH CHECK (true);



ALTER TABLE "public"."idea_milestones_and_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idea_optimization_suggestion" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_optimization_suggestion: admin/manager all" ON "public"."idea_optimization_suggestion" USING ("public"."is_admin_or_manager"());



CREATE POLICY "idea_optimization_suggestion: creator all" ON "public"."idea_optimization_suggestion" USING ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_optimization_suggestion"."idea_id") AND ("i"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_optimization_suggestion"."idea_id") AND ("i"."created_by" = "auth"."uid"())))));



CREATE POLICY "idea_optimization_suggestion: project authorized user read" ON "public"."idea_optimization_suggestion" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_optimization_suggestion"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "idea_pdef: admin/manager all" ON "public"."idea_product_definition_and_flows" USING ("public"."is_admin_or_manager"());



CREATE POLICY "idea_pdef: creator all" ON "public"."idea_product_definition_and_flows" USING ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_product_definition_and_flows"."idea_id") AND ("i"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_product_definition_and_flows"."idea_id") AND ("i"."created_by" = "auth"."uid"())))));



CREATE POLICY "idea_pdef: project authorized user read" ON "public"."idea_product_definition_and_flows" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_product_definition_and_flows"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."idea_prd" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_prd_all" ON "public"."idea_prd" USING (true) WITH CHECK (true);



ALTER TABLE "public"."idea_product_definition_and_flows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idea_report" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_report_all" ON "public"."idea_report" USING (true) WITH CHECK (true);



CREATE POLICY "idea_structure: admin/manager all" ON "public"."idea_structure_and_align" USING ("public"."is_admin_or_manager"());



CREATE POLICY "idea_structure: creator all" ON "public"."idea_structure_and_align" USING ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_structure_and_align"."idea_id") AND ("i"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_structure_and_align"."idea_id") AND ("i"."created_by" = "auth"."uid"())))));



CREATE POLICY "idea_structure: project authorized user read" ON "public"."idea_structure_and_align" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_structure_and_align"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."idea_structure_and_align" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idea_styles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_styles: admin/manager all" ON "public"."idea_styles" USING ("public"."is_admin_or_manager"());



CREATE POLICY "idea_styles: creator all" ON "public"."idea_styles" USING ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_styles"."idea_id") AND ("i"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."idea" "i"
  WHERE (("i"."id" = "idea_styles"."idea_id") AND ("i"."created_by" = "auth"."uid"())))));



CREATE POLICY "idea_styles: project authorized user read" ON "public"."idea_styles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "idea_styles"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "int_conv_proj_msg: delete_own" ON "public"."conversation_project_internal_message" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "int_conv_proj_msg: insert" ON "public"."conversation_project_internal_message" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND ("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."internal_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_internal_message"."project_id"))))));



CREATE POLICY "int_conv_proj_msg: select" ON "public"."conversation_project_internal_message" FOR SELECT USING (("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."internal_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_internal_message"."project_id")))));



CREATE POLICY "int_conv_proj_msg: update_own" ON "public"."conversation_project_internal_message" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "int_conv_proj_msg_thread: delete_own" ON "public"."conversation_project_internal_message_thread" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "int_conv_proj_msg_thread: insert" ON "public"."conversation_project_internal_message_thread" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND ("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."internal_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_internal_message_thread"."project_id"))))));



CREATE POLICY "int_conv_proj_msg_thread: select" ON "public"."conversation_project_internal_message_thread" FOR SELECT USING (("public"."is_admin_or_manager"() OR ("auth"."uid"() IN ( SELECT "unnest"("p"."internal_conversation_authorized_users") AS "unnest"
   FROM "public"."project" "p"
  WHERE ("p"."id" = "conversation_project_internal_message_thread"."project_id")))));



CREATE POLICY "int_conv_proj_msg_thread: update_own" ON "public"."conversation_project_internal_message_thread" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."internal_goal" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "internal_goal: admin/manager all" ON "public"."internal_goal" USING ("public"."is_admin_or_manager"());



CREATE POLICY "internal_goal: internal staff all" ON "public"."internal_goal" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."internal_key_result" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "internal_key_result: admin/manager all" ON "public"."internal_key_result" USING ("public"."is_admin_or_manager"());



CREATE POLICY "internal_key_result: internal staff all" ON "public"."internal_key_result" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."internal_key_result_track" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "internal_key_result_track: admin/manager all" ON "public"."internal_key_result_track" USING ("public"."is_admin_or_manager"());



CREATE POLICY "internal_key_result_track: internal staff all" ON "public"."internal_key_result_track" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."internal_project" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "internal_project: staff all" ON "public"."internal_project" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."internal_project_task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."internal_project_task_comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."internal_project_task_time_track" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "internal_task: staff all" ON "public"."internal_project_task" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "internal_task_comment: staff all" ON "public"."internal_project_task_comment" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "internal_task_time_track: staff all" ON "public"."internal_project_task_time_track" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."mkt_ad_campaign" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_ad_campaign: admin/manager all" ON "public"."mkt_ad_campaign" USING ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_ad_campaign: project member all" ON "public"."mkt_ad_campaign" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_ad_campaign"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_campaign" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_campaign: admin/manager all" ON "public"."mkt_campaign" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_campaign: project member all" ON "public"."mkt_campaign" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_campaign"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_content" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_content: admin/manager all" ON "public"."mkt_content" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_content: project member all" ON "public"."mkt_content" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_content"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_decision_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_decision_log: admin/manager all" ON "public"."mkt_decision_log" USING ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_decision_log: project member all" ON "public"."mkt_decision_log" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_decision_log"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_event" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_event: admin/manager all" ON "public"."mkt_event" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_event: project member all" ON "public"."mkt_event" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_event"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_interview" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_interview: admin/manager all" ON "public"."mkt_interview" USING ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_interview: project member all" ON "public"."mkt_interview" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_interview"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_landing" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_landing: admin/manager all" ON "public"."mkt_landing" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_landing: project member all" ON "public"."mkt_landing" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_landing"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_outreach" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_outreach: admin/manager all" ON "public"."mkt_outreach" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_outreach: project member all" ON "public"."mkt_outreach" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_outreach"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_prospect" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_prospect: admin/manager all" ON "public"."mkt_prospect" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_prospect: project member all" ON "public"."mkt_prospect" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_prospect"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_research_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_research_cache: admin/manager all" ON "public"."mkt_research_cache" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_research_cache: project member all" ON "public"."mkt_research_cache" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_research_cache"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_sequence_step" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_sequence_step: admin/manager all" ON "public"."mkt_sequence_step" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_sequence_step: project member all" ON "public"."mkt_sequence_step" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_sequence_step"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_signal" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_signal: admin/manager all" ON "public"."mkt_signal" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_signal: project member all" ON "public"."mkt_signal" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_signal"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_source_run" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_source_run: admin/manager all" ON "public"."mkt_source_run" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_source_run: project member all" ON "public"."mkt_source_run" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_source_run"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_suppression" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_suppression: admin/manager all" ON "public"."mkt_suppression" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_suppression: project member all" ON "public"."mkt_suppression" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_suppression"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."mkt_validation" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mkt_validation: admin/manager all" ON "public"."mkt_validation" USING ("public"."is_admin_or_manager"()) WITH CHECK ("public"."is_admin_or_manager"());



CREATE POLICY "mkt_validation: project member all" ON "public"."mkt_validation" USING ((EXISTS ( SELECT 1
   FROM ("public"."idea" "i"
     JOIN "public"."project" "p" ON (("p"."id" = "i"."project_id")))
  WHERE (("i"."id" = "mkt_validation"."idea_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "priv_chatbot: staff own" ON "public"."private_chatbot" USING ((("auth"."uid"() = "created_by") AND "public"."is_staff_role"())) WITH CHECK ((("auth"."uid"() = "created_by") AND "public"."is_staff_role"()));



CREATE POLICY "priv_chatbot_msg: staff delete" ON "public"."private_chatbot_message" FOR DELETE USING (("public"."is_staff_role"() AND ("auth"."uid"() IN ( SELECT "b"."created_by" AS "owner_id"
   FROM "public"."private_chatbot" "b"
  WHERE ("b"."id" = "private_chatbot_message"."chatbot_id")))));



CREATE POLICY "priv_chatbot_msg: staff insert" ON "public"."private_chatbot_message" FOR INSERT WITH CHECK (("public"."is_staff_role"() AND ("auth"."uid"() IN ( SELECT "b"."created_by" AS "owner_id"
   FROM "public"."private_chatbot" "b"
  WHERE ("b"."id" = "private_chatbot_message"."chatbot_id")))));



CREATE POLICY "priv_chatbot_msg: staff select" ON "public"."private_chatbot_message" FOR SELECT USING (("public"."is_staff_role"() AND ("auth"."uid"() IN ( SELECT "b"."created_by" AS "owner_id"
   FROM "public"."private_chatbot" "b"
  WHERE ("b"."id" = "private_chatbot_message"."chatbot_id")))));



CREATE POLICY "priv_conv: delete_own" ON "public"."conversation_private" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "priv_conv: insert" ON "public"."conversation_private" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND ("auth"."uid"() = ANY ("participant_user_ids"))));



CREATE POLICY "priv_conv: select" ON "public"."conversation_private" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ANY ("participant_user_ids")));



CREATE POLICY "priv_conv_msg: delete_own" ON "public"."conversation_private_message" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "priv_conv_msg: insert" ON "public"."conversation_private_message" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND ("auth"."uid"() IN ( SELECT "unnest"("c"."participant_user_ids") AS "unnest"
   FROM "public"."conversation_private" "c"
  WHERE ("c"."id" = "conversation_private_message"."conversation_id")))));



CREATE POLICY "priv_conv_msg: select" ON "public"."conversation_private_message" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "unnest"("c"."participant_user_ids") AS "unnest"
   FROM "public"."conversation_private" "c"
  WHERE ("c"."id" = "conversation_private_message"."conversation_id"))));



CREATE POLICY "priv_conv_msg: update_own" ON "public"."conversation_private_message" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "priv_conv_msg_thread: delete_own" ON "public"."conversation_private_message_thread" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "priv_conv_msg_thread: insert" ON "public"."conversation_private_message_thread" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND ("auth"."uid"() IN ( SELECT "unnest"("c"."participant_user_ids") AS "unnest"
   FROM "public"."conversation_private" "c"
  WHERE ("c"."id" = "conversation_private_message_thread"."conversation_id")))));



CREATE POLICY "priv_conv_msg_thread: select" ON "public"."conversation_private_message_thread" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "unnest"("c"."participant_user_ids") AS "unnest"
   FROM "public"."conversation_private" "c"
  WHERE ("c"."id" = "conversation_private_message_thread"."conversation_id"))));



CREATE POLICY "priv_conv_msg_thread: update_own" ON "public"."conversation_private_message_thread" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."private_chatbot" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_chatbot_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: admin/manager read all" ON "public"."profiles" FOR SELECT USING ("public"."is_admin_or_manager"());



CREATE POLICY "profiles: project co-member read" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("auth"."uid"() = ANY ("p"."authorized_users")) AND ("profiles"."id" = ANY ("p"."authorized_users"))))));



CREATE POLICY "profiles: read own" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles: update own" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."project" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project: admin/manager all" ON "public"."project" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project: operational read authorized" ON "public"."project" FOR SELECT USING (("public"."is_operational_user"() AND ("auth"."uid"() = ANY ("authorized_users"))));



CREATE POLICY "project: referrer read own" ON "public"."project" FOR SELECT USING ((("public"."get_user_type"() = 'referrer'::"public"."os_user_type") AND ("referrer_id" = "auth"."uid"())));



ALTER TABLE "public"."project_agreement_version" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_agreement_version: admin/manager all" ON "public"."project_agreement_version" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_agreement_version: authorized user read" ON "public"."project_agreement_version" FOR SELECT USING (("auth"."uid"() = ANY ("authorized_users")));



CREATE POLICY "project_agreement_version: signer update" ON "public"."project_agreement_version" FOR UPDATE USING (("auth"."uid"() = ANY ("required_signers"))) WITH CHECK (("auth"."uid"() = ANY ("required_signers")));



ALTER TABLE "public"."project_chatbot_message" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_chatbot_message: members rw" ON "public"."project_chatbot_message" USING ((("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type"])) OR (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_chatbot_message"."project_id") AND ("auth"."uid"() = ANY ("p"."external_conversation_authorized_users"))))))) WITH CHECK ((("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type"])) OR (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_chatbot_message"."project_id") AND ("auth"."uid"() = ANY ("p"."external_conversation_authorized_users")))))));



ALTER TABLE "public"."project_daily_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_daily_feedback: admin/manager all" ON "public"."project_daily_feedback" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_daily_feedback: authorized user read" ON "public"."project_daily_feedback" FOR SELECT USING ((("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_daily_feedback"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "project_daily_feedback: owner delete" ON "public"."project_daily_feedback" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_daily_feedback: owner update" ON "public"."project_daily_feedback" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."project_file" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_file: admin/manager all" ON "public"."project_file" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_file: authorized user read" ON "public"."project_file" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_file"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "project_file: owner delete" ON "public"."project_file" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_file: owner update" ON "public"."project_file" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."project_internal_chatbot_message" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_internal_chatbot_message: members rw" ON "public"."project_internal_chatbot_message" USING ((("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type"])) OR (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_internal_chatbot_message"."project_id") AND ("auth"."uid"() = ANY ("p"."internal_conversation_authorized_users"))))))) WITH CHECK ((("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type"])) OR (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_internal_chatbot_message"."project_id") AND ("auth"."uid"() = ANY ("p"."internal_conversation_authorized_users")))))));



ALTER TABLE "public"."project_invoice" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_invoice: admin/manager all" ON "public"."project_invoice" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_invoice: authorized user insert" ON "public"."project_invoice" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_invoice"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "project_invoice: creator read" ON "public"."project_invoice" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_invoice: owner delete" ON "public"."project_invoice" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_invoice: owner update" ON "public"."project_invoice" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."project_link" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_link: admin/manager all" ON "public"."project_link" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_link: authorized user read" ON "public"."project_link" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_link"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "project_link: owner delete" ON "public"."project_link" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_link: owner update" ON "public"."project_link" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."project_playbook_comment" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_playbook_comment: admin/manager all" ON "public"."project_playbook_comment" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_playbook_comment: authorized user insert" ON "public"."project_playbook_comment" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_playbook_comment"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "project_playbook_comment: authorized user read" ON "public"."project_playbook_comment" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_playbook_comment"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "project_playbook_comment: owner delete" ON "public"."project_playbook_comment" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_playbook_comment: owner update" ON "public"."project_playbook_comment" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."project_playbook_comment_reply" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_playbook_comment_reply: admin/manager all" ON "public"."project_playbook_comment_reply" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_playbook_comment_reply: authorized user insert" ON "public"."project_playbook_comment_reply" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_playbook_comment_reply"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "project_playbook_comment_reply: authorized user read" ON "public"."project_playbook_comment_reply" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_playbook_comment_reply"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "project_playbook_comment_reply: owner delete" ON "public"."project_playbook_comment_reply" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_playbook_comment_reply: owner update" ON "public"."project_playbook_comment_reply" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."project_playbook_version" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_playbook_version: admin/manager all" ON "public"."project_playbook_version" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_playbook_version: project member read" ON "public"."project_playbook_version" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_playbook_version"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



ALTER TABLE "public"."project_qa_time_track" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_task_comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_task_time_track" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_video" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_video: admin/manager all" ON "public"."project_video" USING ("public"."is_admin_or_manager"());



CREATE POLICY "project_video: authorized user read" ON "public"."project_video" FOR SELECT USING ((("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_video"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "project_video: owner delete" ON "public"."project_video" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "project_video: owner update" ON "public"."project_video" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."prompt" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prompt: admin/manager all" ON "public"."prompt" USING ("public"."is_admin_or_manager"());



ALTER TABLE "public"."prompt_group" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prompt_group: admin/manager all" ON "public"."prompt_group" USING ("public"."is_admin_or_manager"());



CREATE POLICY "qa_time_track: admin/manager all" ON "public"."project_qa_time_track" USING ("public"."is_admin_or_manager"());



CREATE POLICY "qa_time_track: operational all" ON "public"."project_qa_time_track" USING (("public"."is_operational_user"() AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_qa_time_track"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



ALTER TABLE "public"."sop" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sop: admin/manager all" ON "public"."sop" USING ("public"."is_admin_or_manager"());



CREATE POLICY "sop: authorized user read" ON "public"."sop" FOR SELECT USING (("auth"."uid"() = ANY ("authorized_users")));



CREATE POLICY "sop: authorized user type read" ON "public"."sop" FOR SELECT USING (("public"."get_user_type"() = ANY ("authorized_user_types")));



CREATE POLICY "sop: creator manage own" ON "public"."sop" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."sop_tag" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sop_tag: admin/manager all" ON "public"."sop_tag" USING ("public"."is_admin_or_manager"());



CREATE POLICY "sop_tag: authenticated read" ON "public"."sop_tag" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."sop_version" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sop_version: admin/manager all" ON "public"."sop_version" USING ("public"."is_admin_or_manager"());



CREATE POLICY "sop_version: authorized user read" ON "public"."sop_version" FOR SELECT USING (("auth"."uid"() = ANY ("authorized_users")));



CREATE POLICY "sop_version: authorized user type read" ON "public"."sop_version" FOR SELECT USING (("public"."get_user_type"() = ANY ("authorized_user_types")));



ALTER TABLE "public"."talent" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "talent: staff all" ON "public"."talent" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "talent_prog_lang: admin/manager all" ON "public"."talent_programming_language" USING ("public"."is_admin_or_manager"());



CREATE POLICY "talent_prog_lang: own read" ON "public"."talent_programming_language" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."talent" "t"
  WHERE (("t"."id" = "talent_programming_language"."talent_id") AND ("t"."user_account_id" = "auth"."uid"())))));



ALTER TABLE "public"."talent_programming_language" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "talent_programming_language: staff all" ON "public"."talent_programming_language" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."talent_referred_by" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "talent_referred_by: code-present read" ON "public"."talent_referred_by" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("code" IS NOT NULL)));



CREATE POLICY "talent_referred_by: staff all" ON "public"."talent_referred_by" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



ALTER TABLE "public"."talent_tool" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "talent_tool: admin/manager all" ON "public"."talent_tool" USING ("public"."is_admin_or_manager"());



CREATE POLICY "talent_tool: own read" ON "public"."talent_tool" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."talent" "t"
  WHERE (("t"."id" = "talent_tool"."talent_id") AND ("t"."user_account_id" = "auth"."uid"())))));



CREATE POLICY "talent_tool: staff all" ON "public"."talent_tool" TO "authenticated" USING (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"]))) WITH CHECK (("public"."get_user_type"() = ANY (ARRAY['admin'::"public"."os_user_type", 'manager'::"public"."os_user_type", 'operational'::"public"."os_user_type"])));



CREATE POLICY "task: admin/manager all" ON "public"."project_task" USING ("public"."is_admin_or_manager"());



CREATE POLICY "task: authorized user read" ON "public"."project_task" FOR SELECT USING (("public"."is_operational_user"() AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: client delete own" ON "public"."project_task" FOR DELETE USING ((("public"."get_user_type"() = 'client'::"public"."os_user_type") AND ("type" = 'client_requests'::"public"."os_task_type") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "task: client insert" ON "public"."project_task" FOR INSERT WITH CHECK ((("public"."get_user_type"() = 'client'::"public"."os_user_type") AND ("type" = 'client_requests'::"public"."os_task_type") AND ("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: client update" ON "public"."project_task" FOR UPDATE USING ((("public"."get_user_type"() = 'client'::"public"."os_user_type") AND ("type" = 'client_requests'::"public"."os_task_type") AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: developer delete" ON "public"."project_task" FOR DELETE USING ((("public"."get_user_type"() = 'developer'::"public"."os_user_type") AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: developer insert" ON "public"."project_task" FOR INSERT WITH CHECK ((("public"."get_user_type"() = 'developer'::"public"."os_user_type") AND ("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: developer update" ON "public"."project_task" FOR UPDATE USING ((("public"."get_user_type"() = 'developer'::"public"."os_user_type") AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: qa delete own" ON "public"."project_task" FOR DELETE USING ((("public"."get_user_type"() = 'qa'::"public"."os_user_type") AND ("type" = 'qa_requests'::"public"."os_task_type") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "task: qa insert" ON "public"."project_task" FOR INSERT WITH CHECK ((("public"."get_user_type"() = 'qa'::"public"."os_user_type") AND ("type" = 'qa_requests'::"public"."os_task_type") AND ("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task: qa update" ON "public"."project_task" FOR UPDATE USING ((("public"."get_user_type"() = 'qa'::"public"."os_user_type") AND ("type" = 'qa_requests'::"public"."os_task_type") AND (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users")))))));



CREATE POLICY "task_comment: admin/manager all" ON "public"."project_task_comment" USING ("public"."is_admin_or_manager"());



CREATE POLICY "task_comment: authorized user read" ON "public"."project_task_comment" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task_comment"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))));



CREATE POLICY "task_comment: owner insert" ON "public"."project_task_comment" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "task_comment: owner modify" ON "public"."project_task_comment" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "time_track: admin/manager all" ON "public"."project_task_time_track" USING ("public"."is_admin_or_manager"());



CREATE POLICY "time_track: operational all" ON "public"."project_task_time_track" USING (("public"."is_operational_user"() AND (("assignee_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."project" "p"
  WHERE (("p"."id" = "project_task_time_track"."project_id") AND ("auth"."uid"() = ANY ("p"."authorized_users"))))))));



ALTER TABLE "public"."user_ai_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_ai_settings: own row" ON "public"."user_ai_settings" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_internal_project_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_internal_project_message_thread";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_private_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_private_message_thread";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_project_external_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_project_external_message_thread";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_project_internal_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_project_internal_message_thread";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."idea_chatbot";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."private_chatbot_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."project_chatbot_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."project_internal_chatbot_message";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."can_write_workspace"("p_workspace" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_write_workspace"("p_workspace" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_write_workspace"("p_workspace" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."feedback_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."feedback_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."feedback_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fill_project_conversation_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."fill_project_conversation_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fill_project_conversation_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_talent_by_code"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_talent_by_code"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_talent_by_code"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_agency_role"("p_agency" "uuid", "p_role" "public"."agency_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_agency_role"("p_agency" "uuid", "p_role" "public"."agency_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_agency_role"("p_agency" "uuid", "p_role" "public"."agency_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."idea_auto_version_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."idea_auto_version_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."idea_auto_version_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."idea_update_version_on_project_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."idea_update_version_on_project_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."idea_update_version_on_project_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_agency_member"("p_agency" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_agency_member"("p_agency" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_agency_member"("p_agency" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_operational_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_operational_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_operational_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_member"("p_workspace" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("p_workspace" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("p_workspace" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_conversation_internal_project_messages_viewed"("p_internal_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_conversation_internal_project_messages_viewed"("p_internal_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_internal_project_messages_viewed"("p_internal_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_internal_project_messages_viewed"("p_internal_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_conversation_internal_project_thread_viewed"("p_parent_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_conversation_internal_project_thread_viewed"("p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_internal_project_thread_viewed"("p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_internal_project_thread_viewed"("p_parent_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_external_project_messages_viewed"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_external_project_messages_viewed"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_external_project_messages_viewed"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_external_project_messages_viewed"("p_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_external_project_thread_viewed"("p_parent_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_external_project_thread_viewed"("p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_external_project_thread_viewed"("p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_external_project_thread_viewed"("p_parent_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_internal_project_messages_viewed"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_internal_project_messages_viewed"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_internal_project_messages_viewed"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_internal_project_messages_viewed"("p_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_internal_project_thread_viewed"("p_parent_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_internal_project_thread_viewed"("p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_internal_project_thread_viewed"("p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_internal_project_thread_viewed"("p_parent_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_internal_task_comments_viewed"("p_internal_task_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_internal_task_comments_viewed"("p_internal_task_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_internal_task_comments_viewed"("p_internal_task_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_internal_task_comments_viewed"("p_internal_task_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_playbook_comment_replies_viewed"("p_comment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_playbook_comment_replies_viewed"("p_comment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_playbook_comment_replies_viewed"("p_comment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_playbook_comment_replies_viewed"("p_comment_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_playbook_comments_viewed"("p_playbook_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_playbook_comments_viewed"("p_playbook_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_playbook_comments_viewed"("p_playbook_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_playbook_comments_viewed"("p_playbook_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_private_conversation_messages_viewed"("p_conversation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_private_conversation_messages_viewed"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_private_conversation_messages_viewed"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_private_conversation_messages_viewed"("p_conversation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_private_conversation_thread_viewed"("p_parent_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_private_conversation_thread_viewed"("p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_private_conversation_thread_viewed"("p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_private_conversation_thread_viewed"("p_parent_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_task_comments_viewed"("p_task_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_task_comments_viewed"("p_task_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_task_comments_viewed"("p_task_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_task_comments_viewed"("p_task_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."project_agreement_version_auto_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."project_agreement_version_auto_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."project_agreement_version_auto_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."project_invoice_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."project_invoice_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."project_invoice_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."public_table_columns"("p_table" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_table_columns"("p_table" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_table_columns"("p_table" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."public_table_list"() TO "anon";
GRANT ALL ON FUNCTION "public"."public_table_list"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_table_list"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sign_agreement"("p_agreement_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sign_agreement"("p_agreement_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sign_agreement"("p_agreement_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sign_agreement"("p_agreement_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."talent_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."talent_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."talent_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_project_chatbot_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_project_chatbot_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_project_chatbot_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_talent_by_code"("p_code" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_talent_by_code"("p_code" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_talent_by_code"("p_code" "text", "p_payload" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."agency" TO "anon";
GRANT ALL ON TABLE "public"."agency" TO "authenticated";
GRANT ALL ON TABLE "public"."agency" TO "service_role";



GRANT ALL ON TABLE "public"."agency_ai_settings" TO "anon";
GRANT ALL ON TABLE "public"."agency_ai_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."agency_ai_settings" TO "service_role";



GRANT ALL ON TABLE "public"."agreement_template" TO "anon";
GRANT ALL ON TABLE "public"."agreement_template" TO "authenticated";
GRANT ALL ON TABLE "public"."agreement_template" TO "service_role";



GRANT ALL ON TABLE "public"."client" TO "anon";
GRANT ALL ON TABLE "public"."client" TO "authenticated";
GRANT ALL ON TABLE "public"."client" TO "service_role";



GRANT ALL ON TABLE "public"."client_who_referred_this_talent" TO "anon";
GRANT ALL ON TABLE "public"."client_who_referred_this_talent" TO "authenticated";
GRANT ALL ON TABLE "public"."client_who_referred_this_talent" TO "service_role";



GRANT ALL ON TABLE "public"."company" TO "anon";
GRANT ALL ON TABLE "public"."company" TO "authenticated";
GRANT ALL ON TABLE "public"."company" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_internal_project_message" TO "anon";
GRANT ALL ON TABLE "public"."conversation_internal_project_message" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_internal_project_message" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_internal_project_message_thread" TO "anon";
GRANT ALL ON TABLE "public"."conversation_internal_project_message_thread" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_internal_project_message_thread" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_private" TO "anon";
GRANT ALL ON TABLE "public"."conversation_private" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_private" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_private_message" TO "anon";
GRANT ALL ON TABLE "public"."conversation_private_message" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_private_message" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_private_message_thread" TO "anon";
GRANT ALL ON TABLE "public"."conversation_private_message_thread" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_private_message_thread" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_project_external_message" TO "anon";
GRANT ALL ON TABLE "public"."conversation_project_external_message" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_project_external_message" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_project_external_message_thread" TO "anon";
GRANT ALL ON TABLE "public"."conversation_project_external_message_thread" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_project_external_message_thread" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_project_internal_message" TO "anon";
GRANT ALL ON TABLE "public"."conversation_project_internal_message" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_project_internal_message" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_project_internal_message_thread" TO "anon";
GRANT ALL ON TABLE "public"."conversation_project_internal_message_thread" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_project_internal_message_thread" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."idea" TO "anon";
GRANT ALL ON TABLE "public"."idea" TO "authenticated";
GRANT ALL ON TABLE "public"."idea" TO "service_role";



GRANT ALL ON TABLE "public"."idea_benchmarking" TO "anon";
GRANT ALL ON TABLE "public"."idea_benchmarking" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_benchmarking" TO "service_role";



GRANT ALL ON TABLE "public"."idea_chatbot" TO "anon";
GRANT ALL ON TABLE "public"."idea_chatbot" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_chatbot" TO "service_role";



GRANT ALL ON TABLE "public"."idea_chatbot_devil_advocate" TO "anon";
GRANT ALL ON TABLE "public"."idea_chatbot_devil_advocate" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_chatbot_devil_advocate" TO "service_role";



GRANT ALL ON TABLE "public"."idea_database" TO "anon";
GRANT ALL ON TABLE "public"."idea_database" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_database" TO "service_role";



GRANT ALL ON TABLE "public"."idea_icp" TO "anon";
GRANT ALL ON TABLE "public"."idea_icp" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_icp" TO "service_role";



GRANT ALL ON TABLE "public"."idea_milestones_and_tasks" TO "anon";
GRANT ALL ON TABLE "public"."idea_milestones_and_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_milestones_and_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."idea_optimization_suggestion" TO "anon";
GRANT ALL ON TABLE "public"."idea_optimization_suggestion" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_optimization_suggestion" TO "service_role";



GRANT ALL ON TABLE "public"."idea_prd" TO "anon";
GRANT ALL ON TABLE "public"."idea_prd" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_prd" TO "service_role";



GRANT ALL ON TABLE "public"."idea_product_definition_and_flows" TO "anon";
GRANT ALL ON TABLE "public"."idea_product_definition_and_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_product_definition_and_flows" TO "service_role";



GRANT ALL ON TABLE "public"."idea_report" TO "anon";
GRANT ALL ON TABLE "public"."idea_report" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_report" TO "service_role";



GRANT ALL ON TABLE "public"."idea_structure_and_align" TO "anon";
GRANT ALL ON TABLE "public"."idea_structure_and_align" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_structure_and_align" TO "service_role";



GRANT ALL ON TABLE "public"."idea_styles" TO "anon";
GRANT ALL ON TABLE "public"."idea_styles" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_styles" TO "service_role";



GRANT ALL ON TABLE "public"."internal_goal" TO "anon";
GRANT ALL ON TABLE "public"."internal_goal" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_goal" TO "service_role";



GRANT ALL ON TABLE "public"."internal_key_result" TO "anon";
GRANT ALL ON TABLE "public"."internal_key_result" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_key_result" TO "service_role";



GRANT ALL ON TABLE "public"."internal_key_result_track" TO "anon";
GRANT ALL ON TABLE "public"."internal_key_result_track" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_key_result_track" TO "service_role";



GRANT ALL ON TABLE "public"."internal_project" TO "anon";
GRANT ALL ON TABLE "public"."internal_project" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_project" TO "service_role";



GRANT ALL ON TABLE "public"."internal_project_task" TO "anon";
GRANT ALL ON TABLE "public"."internal_project_task" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_project_task" TO "service_role";



GRANT ALL ON TABLE "public"."internal_project_task_comment" TO "anon";
GRANT ALL ON TABLE "public"."internal_project_task_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_project_task_comment" TO "service_role";



GRANT ALL ON TABLE "public"."internal_project_task_time_track" TO "anon";
GRANT ALL ON TABLE "public"."internal_project_task_time_track" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_project_task_time_track" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_ad_campaign" TO "anon";
GRANT ALL ON TABLE "public"."mkt_ad_campaign" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_ad_campaign" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_campaign" TO "anon";
GRANT ALL ON TABLE "public"."mkt_campaign" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_campaign" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_content" TO "anon";
GRANT ALL ON TABLE "public"."mkt_content" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_content" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_decision_log" TO "anon";
GRANT ALL ON TABLE "public"."mkt_decision_log" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_decision_log" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_event" TO "anon";
GRANT ALL ON TABLE "public"."mkt_event" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_event" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_interview" TO "anon";
GRANT ALL ON TABLE "public"."mkt_interview" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_interview" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_landing" TO "anon";
GRANT ALL ON TABLE "public"."mkt_landing" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_landing" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_outreach" TO "anon";
GRANT ALL ON TABLE "public"."mkt_outreach" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_outreach" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_prospect" TO "anon";
GRANT ALL ON TABLE "public"."mkt_prospect" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_prospect" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_research_cache" TO "anon";
GRANT ALL ON TABLE "public"."mkt_research_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_research_cache" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_sequence_step" TO "anon";
GRANT ALL ON TABLE "public"."mkt_sequence_step" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_sequence_step" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_signal" TO "anon";
GRANT ALL ON TABLE "public"."mkt_signal" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_signal" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_source_run" TO "anon";
GRANT ALL ON TABLE "public"."mkt_source_run" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_source_run" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_suppression" TO "anon";
GRANT ALL ON TABLE "public"."mkt_suppression" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_suppression" TO "service_role";



GRANT ALL ON TABLE "public"."mkt_validation" TO "anon";
GRANT ALL ON TABLE "public"."mkt_validation" TO "authenticated";
GRANT ALL ON TABLE "public"."mkt_validation" TO "service_role";



GRANT ALL ON TABLE "public"."private_chatbot" TO "anon";
GRANT ALL ON TABLE "public"."private_chatbot" TO "authenticated";
GRANT ALL ON TABLE "public"."private_chatbot" TO "service_role";



GRANT ALL ON TABLE "public"."private_chatbot_message" TO "anon";
GRANT ALL ON TABLE "public"."private_chatbot_message" TO "authenticated";
GRANT ALL ON TABLE "public"."private_chatbot_message" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project" TO "anon";
GRANT ALL ON TABLE "public"."project" TO "authenticated";
GRANT ALL ON TABLE "public"."project" TO "service_role";



GRANT ALL ON TABLE "public"."project_agreement_version" TO "anon";
GRANT ALL ON TABLE "public"."project_agreement_version" TO "authenticated";
GRANT ALL ON TABLE "public"."project_agreement_version" TO "service_role";



GRANT ALL ON TABLE "public"."project_chatbot_message" TO "anon";
GRANT ALL ON TABLE "public"."project_chatbot_message" TO "authenticated";
GRANT ALL ON TABLE "public"."project_chatbot_message" TO "service_role";



GRANT ALL ON TABLE "public"."project_daily_feedback" TO "anon";
GRANT ALL ON TABLE "public"."project_daily_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."project_daily_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."project_file" TO "anon";
GRANT ALL ON TABLE "public"."project_file" TO "authenticated";
GRANT ALL ON TABLE "public"."project_file" TO "service_role";



GRANT ALL ON TABLE "public"."project_internal_chatbot_message" TO "anon";
GRANT ALL ON TABLE "public"."project_internal_chatbot_message" TO "authenticated";
GRANT ALL ON TABLE "public"."project_internal_chatbot_message" TO "service_role";



GRANT ALL ON TABLE "public"."project_invoice" TO "anon";
GRANT ALL ON TABLE "public"."project_invoice" TO "authenticated";
GRANT ALL ON TABLE "public"."project_invoice" TO "service_role";



GRANT ALL ON TABLE "public"."project_link" TO "anon";
GRANT ALL ON TABLE "public"."project_link" TO "authenticated";
GRANT ALL ON TABLE "public"."project_link" TO "service_role";



GRANT ALL ON TABLE "public"."project_playbook_comment" TO "anon";
GRANT ALL ON TABLE "public"."project_playbook_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."project_playbook_comment" TO "service_role";



GRANT ALL ON TABLE "public"."project_playbook_comment_reply" TO "anon";
GRANT ALL ON TABLE "public"."project_playbook_comment_reply" TO "authenticated";
GRANT ALL ON TABLE "public"."project_playbook_comment_reply" TO "service_role";



GRANT ALL ON TABLE "public"."project_playbook_version" TO "anon";
GRANT ALL ON TABLE "public"."project_playbook_version" TO "authenticated";
GRANT ALL ON TABLE "public"."project_playbook_version" TO "service_role";



GRANT ALL ON TABLE "public"."project_qa_time_track" TO "anon";
GRANT ALL ON TABLE "public"."project_qa_time_track" TO "authenticated";
GRANT ALL ON TABLE "public"."project_qa_time_track" TO "service_role";



GRANT ALL ON TABLE "public"."project_task" TO "anon";
GRANT ALL ON TABLE "public"."project_task" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task" TO "service_role";



GRANT ALL ON TABLE "public"."project_task_comment" TO "anon";
GRANT ALL ON TABLE "public"."project_task_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task_comment" TO "service_role";



GRANT ALL ON TABLE "public"."project_task_time_track" TO "anon";
GRANT ALL ON TABLE "public"."project_task_time_track" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task_time_track" TO "service_role";



GRANT ALL ON TABLE "public"."project_video" TO "anon";
GRANT ALL ON TABLE "public"."project_video" TO "authenticated";
GRANT ALL ON TABLE "public"."project_video" TO "service_role";



GRANT ALL ON TABLE "public"."prompt" TO "anon";
GRANT ALL ON TABLE "public"."prompt" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_group" TO "anon";
GRANT ALL ON TABLE "public"."prompt_group" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_group" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prompt_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prompt_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prompt_group_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sop" TO "anon";
GRANT ALL ON TABLE "public"."sop" TO "authenticated";
GRANT ALL ON TABLE "public"."sop" TO "service_role";



GRANT ALL ON TABLE "public"."sop_tag" TO "anon";
GRANT ALL ON TABLE "public"."sop_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."sop_tag" TO "service_role";



GRANT ALL ON TABLE "public"."sop_version" TO "anon";
GRANT ALL ON TABLE "public"."sop_version" TO "authenticated";
GRANT ALL ON TABLE "public"."sop_version" TO "service_role";



GRANT ALL ON TABLE "public"."talent" TO "anon";
GRANT ALL ON TABLE "public"."talent" TO "authenticated";
GRANT ALL ON TABLE "public"."talent" TO "service_role";



GRANT ALL ON TABLE "public"."talent_programming_language" TO "anon";
GRANT ALL ON TABLE "public"."talent_programming_language" TO "authenticated";
GRANT ALL ON TABLE "public"."talent_programming_language" TO "service_role";



GRANT ALL ON TABLE "public"."talent_referred_by" TO "anon";
GRANT ALL ON TABLE "public"."talent_referred_by" TO "authenticated";
GRANT ALL ON TABLE "public"."talent_referred_by" TO "service_role";



GRANT ALL ON TABLE "public"."talent_tool" TO "anon";
GRANT ALL ON TABLE "public"."talent_tool" TO "authenticated";
GRANT ALL ON TABLE "public"."talent_tool" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_ai_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































