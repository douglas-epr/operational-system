-- ================================================================
-- Move37 INTERNAL TOOLS — INITIAL SCHEMA MIGRATION
-- Generated : 2026-03-04
-- Sources   : docs/reference_docs/tabelas.md
--             docs/reference_docs/option-sets.md
-- ================================================================
-- Run order:
--   1. Enums
--   2. Helper functions
--   3. Tables (dependency order)
--   4. Triggers
--   5. RLS enable
--   6. RLS policies
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- SECTION 1 · ENUMS
-- Every Bubble Option Set with stable, finite values becomes a
-- PostgreSQL enum. Large/dynamic sets (country, time slots) stay text.
-- Source: docs/reference_docs/option-sets.md
-- ────────────────────────────────────────────────────────────────

-- os_user_type
CREATE TYPE public.os_user_type AS ENUM (
  'admin',
  'manager',
  'operational',
  'developer',
  'client',
  'qa',
  'referrer',
  'lead'
);

-- os_task_status
CREATE TYPE public.os_task_status AS ENUM (
  'not_started',
  'in_progress',
  'ready_for_qa',
  'done',
  'blocked'
);

-- os_internal_task_status
CREATE TYPE public.os_internal_task_status AS ENUM (
  'not_started',
  'in_progress',
  'done',
  'blocked'
);

-- os_internal_project_status  (Bubble IDs bTRat0…bTRbD0 mapped to readable values)
CREATE TYPE public.os_internal_project_status AS ENUM (
  'not_started',
  'in_progress',
  'ready_for_qa',
  'done',
  'blocked',
  'archived'
);

-- os_internal_key_result_status
CREATE TYPE public.os_internal_key_result_status AS ENUM (
  'not_started',
  'in_progress',
  'ready_for_qa',
  'done',
  'blocked',
  'archived'
);

-- os_internal_goals_status  (Bubble IDs bTUdn, bTRal0…bTRas0 mapped to readable values)
CREATE TYPE public.os_internal_goals_status AS ENUM (
  'prospecting',
  'not_started',
  'in_progress',
  'done',
  'archived',
  'blocked'
);

-- os_project_status
CREATE TYPE public.os_project_status AS ENUM (
  'prospecting',
  'not_started',
  'in_progress',
  'done',
  'blocked',
  'archived',
  'lost_deal'
);

-- os_ai_status
CREATE TYPE public.os_ai_status AS ENUM (
  'pending',
  'in_progress',
  'done'
);

-- os_agreement_status
CREATE TYPE public.os_agreement_status AS ENUM (
  'not_available',
  'ready_to_sign',   -- Bubble: ready_to_client_to_sign
  'completed',
  'archived'
);

-- os_agreement_type
CREATE TYPE public.os_agreement_type AS ENUM (
  'nda',                -- non_disclosure_agreement
  'proposal_quotation',
  'service_agreement',
  'launch_handoff'
);

-- os_project_program
CREATE TYPE public.os_project_program AS ENUM (
  'sandbox_launch',
  'market_ready_product',
  'scale_ready_system',
  'subscription'
);

-- os_project_stage  (18 stages from Bubble os_project_stage)
CREATE TYPE public.os_project_stage AS ENUM (
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

-- os_task_type
CREATE TYPE public.os_task_type AS ENUM (
  'internal_checklist',
  'stages_checking',
  'developer_tasks',
  'client_requests',
  'qa_requests'
);

-- os_task_priority
CREATE TYPE public.os_task_priority AS ENUM (
  'blocker',
  'critical',
  'high',
  'medium',
  'low',
  'trivial'
);

-- os_task_level  (1–4)
CREATE TYPE public.os_task_level AS ENUM (
  'level_1',
  'level_2',
  'level_3',
  'level_4'
);

-- os_task_name  (milestone names)
CREATE TYPE public.os_task_name AS ENUM (
  'milestone_1_sign_in_sign_up',
  'milestone_2_core_client_flows',
  'milestone_3_seller_core_flows',
  'milestone_4_admin_flows',
  'milestone_5_final_qa_handoff',
  'client_requests',
  'qa_requests'
);

-- os_docs_type
CREATE TYPE public.os_docs_type AS ENUM (
  'playbook',
  'agreements',
  'general_docs',
  'links',
  'main_videos',
  'daily_communication',
  'invoices'
);

-- os_professional_type
CREATE TYPE public.os_professional_type AS ENUM (
  'developer',
  'marketing'
);

-- os_company_sector
CREATE TYPE public.os_company_sector AS ENUM (
  'organizational',
  'operational',
  'marketing'
);

-- os_view_type
CREATE TYPE public.os_view_type AS ENUM (
  'list',
  'kanban'
);

-- os_ai_service
CREATE TYPE public.os_ai_service AS ENUM (
  'gemini',
  'claude',
  'openai'
);

-- os_talent_level
CREATE TYPE public.os_talent_level AS ENUM (
  'agency_owner',   -- Agency or Company Owner / CEO
  'cto',
  'tech_lead',
  'senior',
  'mid_level',
  'junior'
);

-- os_talent_authority_level
CREATE TYPE public.os_talent_authority_level AS ENUM (
  'rock_star',
  'known',          -- Bubble: champion
  'unknown',        -- Bubble: builder_pro
  'rising_star',
  'explorer'
);

-- os_idea_block
CREATE TYPE public.os_idea_block AS ENUM (
  'ideas',
  'structure_align',
  'refining_icp',
  'product_definition_flows',
  'strategic_frameworks'
);

-- os_idea_field
CREATE TYPE public.os_idea_field AS ENUM (
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

-- os_programming_language
CREATE TYPE public.os_programming_language AS ENUM (
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
  'solidity'
);

-- os_tool
CREATE TYPE public.os_tool AS ENUM (
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
  'zapier'
);


-- ────────────────────────────────────────────────────────────────
-- SECTION 2 · HELPER FUNCTIONS FOR RLS
-- Defined after public.profiles (SECTION 3) — see below.
-- ────────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────────
-- SECTION 3 · TABLES  (dependency order)
-- Source: docs/reference_docs/tabelas.md
--
-- Convention:
--   • "image" / "file" Bubble fields → TEXT (Supabase Storage URL)
--   • "list of User" → UUID[] (authorized_users pattern)
--   • "list of os_user_type" → os_user_type[]
--   • Large option sets (country, time) → TEXT
--   • Deleted fields are omitted
-- ────────────────────────────────────────────────────────────────

-- ── profiles (extends auth.users) ──────────────────────────────
-- Bubble: User data type
CREATE TABLE public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  picture    TEXT,                         -- Storage URL
  signature  TEXT,                         -- Storage URL (file)
  type       public.os_user_type,
  country    TEXT,                         -- os_country: 137 values → text
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- SECTION 2 · HELPER FUNCTIONS FOR RLS (placed here so public.profiles exists)
-- Called inside every policy; SECURITY DEFINER so they bypass RLS
-- themselves and always query as the service role.
-- ────────────────────────────────────────────────────────────────

-- Returns the os_user_type of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_user_type()
  RETURNS public.os_user_type
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT type FROM public.profiles WHERE id = auth.uid()
$$;

-- TRUE if the current user is admin OR manager.
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT type IN ('admin', 'manager') FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- TRUE if the current user is developer, client, or qa.
CREATE OR REPLACE FUNCTION public.is_operational_user()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT type IN ('developer', 'client', 'qa') FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- ── company ────────────────────────────────────────────────────
-- Bubble: company data type
CREATE TABLE public.company (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  website    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── client ─────────────────────────────────────────────────────
-- Bubble: client data type
CREATE TABLE public.client (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  linkedin   TEXT,
  picture    TEXT,                         -- Storage URL
  country    TEXT,                         -- os_country text
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sop_tag ────────────────────────────────────────────────────
CREATE TABLE public.sop_tag (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sop ────────────────────────────────────────────────────────
-- Bubble: sop data type
-- Privacy rules (tabelas.md):
--   everyone → no access
--   admin/manager → view all, search for, view attachments
--   authorized_users contains current user → view all, search for, view attachments
--   authorized_user_types contains current user type → view all, search for, view attachments
CREATE TABLE public.sop (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT,
  "order"               INTEGER,
  authorized_users      UUID[]      NOT NULL DEFAULT '{}',
  authorized_user_types public.os_user_type[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sop ↔ sop_tag junction ─────────────────────────────────────
-- Bubble: sop.tags = List of custom SOP Paste (sop_tag)
CREATE TABLE public.sop_tags (
  sop_id     UUID NOT NULL REFERENCES public.sop(id)     ON DELETE CASCADE,
  sop_tag_id UUID NOT NULL REFERENCES public.sop_tag(id) ON DELETE CASCADE,
  PRIMARY KEY (sop_id, sop_tag_id)
);

-- ── sop_version ────────────────────────────────────────────────
-- Bubble: sop_version data type
-- Same privacy rules as sop
CREATE TABLE public.sop_version (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id                UUID        NOT NULL REFERENCES public.sop(id) ON DELETE CASCADE,
  version_name          TEXT        NOT NULL,
  content               TEXT,
  authorized_users      UUID[]      NOT NULL DEFAULT '{}',
  authorized_user_types public.os_user_type[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── internal_goal ──────────────────────────────────────────────
-- Bubble: internal_goal data type
CREATE TABLE public.internal_goal (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  "order"     INTEGER,
  description TEXT,
  status      public.os_internal_goals_status NOT NULL DEFAULT 'not_started',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── internal_key_result ────────────────────────────────────────
-- Bubble: internal_key_result data type
CREATE TABLE public.internal_key_result (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_goal_id         UUID        REFERENCES public.internal_goal(id) ON DELETE SET NULL,
  name                     TEXT,
  "order"                  INTEGER,
  start_date               DATE,
  end_date                 DATE,
  achieved                 BOOLEAN     NOT NULL DEFAULT FALSE,
  description              TEXT,
  status                   public.os_internal_key_result_status NOT NULL DEFAULT 'not_started',
  current_key_result_value NUMERIC,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── internal_project ───────────────────────────────────────────
-- Bubble: internal_project data type
CREATE TABLE public.internal_project (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  "order"              INTEGER,
  start_date_real      DATE,
  end_date_real        DATE,
  start_date_estimated DATE,
  end_date_estimated   DATE,
  description          TEXT,
  real_time            NUMERIC,
  estimated_time       NUMERIC,
  status               public.os_internal_project_status NOT NULL DEFAULT 'not_started',
  sector               public.os_company_sector,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bubble: internal_project.assignees = list of user
CREATE TABLE public.internal_project_assignees (
  internal_project_id UUID NOT NULL REFERENCES public.internal_project(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id)          ON DELETE CASCADE,
  PRIMARY KEY (internal_project_id, user_id)
);

-- ── internal_task ──────────────────────────────────────────────
-- Bubble: internal_task data type
CREATE TABLE public.internal_task (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_project_id    UUID        REFERENCES public.internal_project(id)    ON DELETE SET NULL,
  internal_goal_id       UUID        REFERENCES public.internal_goal(id)       ON DELETE SET NULL,
  internal_key_result_id UUID        REFERENCES public.internal_key_result(id) ON DELETE SET NULL,
  name                   TEXT        NOT NULL,
  "order"                INTEGER,
  real_start_date        DATE,
  real_end_date          DATE,
  estimated_start_date   DATE,
  estimated_end_date     DATE,
  description            TEXT,
  real_time              NUMERIC,
  estimated_time         NUMERIC,
  status                 public.os_internal_task_status NOT NULL DEFAULT 'not_started',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bubble: internal_task.assignees = list of users
CREATE TABLE public.internal_task_assignees (
  internal_task_id UUID NOT NULL REFERENCES public.internal_task(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id)       ON DELETE CASCADE,
  PRIMARY KEY (internal_task_id, user_id)
);

-- ── internal_key_result_track ──────────────────────────────────
-- Bubble: internal_key_result_track data type
CREATE TABLE public.internal_key_result_track (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_goal_id                UUID        REFERENCES public.internal_goal(id)       ON DELETE SET NULL,
  internal_key_result_id          UUID        REFERENCES public.internal_key_result(id) ON DELETE SET NULL,
  date                            DATE        NOT NULL,
  value                           NUMERIC,
  achieved                        BOOLEAN     NOT NULL DEFAULT FALSE,
  current_target_key_result_value NUMERIC,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── internal_time_track ────────────────────────────────────────
-- Bubble: internal_time_track data type
CREATE TABLE public.internal_time_track (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  internal_task_id    UUID        REFERENCES public.internal_task(id)    ON DELETE SET NULL,
  internal_project_id UUID        REFERENCES public.internal_project(id) ON DELETE SET NULL,
  start_date          DATE,
  start_time_min      INTEGER,
  end_time_min        INTEGER,
  time_spent_h        NUMERIC,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── talent ─────────────────────────────────────────────────────
-- Bubble: Talent data type
CREATE TABLE public.talent (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 TEXT        UNIQUE,
  name                 TEXT,
  email                TEXT,
  phone                TEXT,
  linkedin             TEXT,
  picture              TEXT,                         -- Storage URL
  portfolio            TEXT,
  user_account_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  country              TEXT,                         -- os_country text
  current_job_position TEXT,
  level                public.os_talent_level,
  current_company_id   UUID        REFERENCES public.company(id)  ON DELETE SET NULL,
  referred_by_id       UUID        REFERENCES public.talent(id)   ON DELETE SET NULL,
  authority_level      public.os_talent_authority_level,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── talent_tool ────────────────────────────────────────────────
-- Bubble: talent_tool data type
CREATE TABLE public.talent_tool (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id  UUID        NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  tool       public.os_tool,
  score      INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── talent_programming_language ────────────────────────────────
-- Bubble: talent_programming_language data type
CREATE TABLE public.talent_programming_language (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id            UUID        NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  programming_language public.os_programming_language,
  score                INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── talent_referred_by ─────────────────────────────────────────
-- Bubble: talent_referred_by data type
CREATE TABLE public.talent_referred_by (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT,
  score          NUMERIC,
  description    TEXT,
  talent_id      UUID        REFERENCES public.talent(id) ON DELETE SET NULL,
  level          public.os_talent_level,
  referred_by_id UUID        REFERENCES public.talent(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── client_who_referred_this_talent ────────────────────────────
-- Bubble: client_who_referred_this_talent data type
CREATE TABLE public.client_who_referred_this_talent (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT,
  score       NUMERIC,
  description TEXT,
  talent_id   UUID        REFERENCES public.talent(id) ON DELETE SET NULL,
  client_id   UUID        REFERENCES public.client(id) ON DELETE SET NULL,
  level       public.os_talent_level,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project ────────────────────────────────────────────────────
-- Bubble: project data type
-- Privacy rules (tabelas.md):
--   everyone → no access
--   referrer → search only, limited fields, only when referrer_id = current user
--   admin/manager → view all, search for, view attachments
--   developer/client/qa → search for (all fields), only when in authorized_users
CREATE TABLE public.project (
  id                                               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                                             TEXT,
  picture                                          TEXT,        -- Storage URL
  price                                            NUMERIC,
  profit                                           NUMERIC,
  referrer_commission                              NUMERIC,
  referrer_revenue                                 NUMERIC,
  start_date_real                                  DATE,
  end_date_real                                    DATE,
  start_date_estimated                             DATE,
  end_date_estimated                               DATE,
  description                                      TEXT,
  real_time                                        NUMERIC,
  estimated_time                                   NUMERIC,
  referrer_id                                      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  authorized_users                                 UUID[]      NOT NULL DEFAULT '{}',
  stage                                            public.os_project_stage,
  program                                          public.os_project_program,
  status                                           public.os_project_status NOT NULL DEFAULT 'prospecting',
  change_automatically_project_estimated_time      BOOLEAN     NOT NULL DEFAULT FALSE,
  change_automatically_milestone_estimated_time    BOOLEAN     NOT NULL DEFAULT FALSE,
  change_automatically_project_start_end_dates     BOOLEAN     NOT NULL DEFAULT FALSE,
  change_automatically_milestone_start_end_dates   BOOLEAN     NOT NULL DEFAULT FALSE,
  company_that_recommended_id                      UUID        REFERENCES public.company(id)                        ON DELETE SET NULL,
  talent_who_recommended_id                        UUID        REFERENCES public.talent(id)                         ON DELETE SET NULL,
  client_who_recommended_id                        UUID        REFERENCES public.client_who_referred_this_talent(id) ON DELETE SET NULL,
  created_at                                       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── task ───────────────────────────────────────────────────────
-- Bubble: task data type
-- Privacy: admin/manager full; authorized_users for operational users
CREATE TABLE public.task (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  parent_task_id       UUID        REFERENCES public.task(id)    ON DELETE SET NULL,
  name                 TEXT,
  "order"              INTEGER,
  start_date_estimated DATE,
  end_date_estimated   DATE,
  start_date_real      DATE,
  end_date_real        DATE,
  description          TEXT,
  real_time            NUMERIC,
  estimated_time       NUMERIC,
  priority_level       INTEGER,
  type                 public.os_task_type,
  authorized_users     UUID[]      NOT NULL DEFAULT '{}',
  level                public.os_task_level,
  status               public.os_task_status NOT NULL DEFAULT 'not_started',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bubble: task.assignees = list of user
CREATE TABLE public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.task(id)     ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- ── time_track ─────────────────────────────────────────────────
-- Bubble: time_track data type
-- Privacy: admin/manager full; developer/client/qa full access
CREATE TABLE public.time_track (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id          UUID        REFERENCES public.task(id)     ON DELETE SET NULL,
  project_id       UUID        REFERENCES public.project(id)  ON DELETE SET NULL,
  start_date       DATE,
  start_time_min   INTEGER,
  end_time_min     INTEGER,
  time_spent_h     NUMERIC,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── qa_time_track ──────────────────────────────────────────────
-- Bubble: qa_time_track data type
CREATE TABLE public.qa_time_track (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id          UUID        REFERENCES public.task(id)     ON DELETE SET NULL,
  project_id       UUID        REFERENCES public.project(id)  ON DELETE SET NULL,
  start_date       DATE,
  start_time_min   INTEGER,
  end_time_min     INTEGER,
  time_spent_h     NUMERIC,
  paid             BOOLEAN     NOT NULL DEFAULT FALSE,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_file ───────────────────────────────────────────────
-- Bubble: project_file data type
-- Privacy: admin/manager full; authorized_users read
CREATE TABLE public.project_file (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_link ───────────────────────────────────────────────
-- Bubble: project_link data type
CREATE TABLE public.project_link (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  url              TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_video ──────────────────────────────────────────────
-- Bubble: project_video data type
CREATE TABLE public.project_video (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  url              TEXT,
  name             TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── task_comment ───────────────────────────────────────────────
-- Bubble: task_comment data type
CREATE TABLE public.task_comment (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID        NOT NULL REFERENCES public.task(id)     ON DELETE CASCADE,
  project_id       UUID        REFERENCES public.project(id)           ON DELETE SET NULL,
  owner_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message          TEXT,
  viewed_by        UUID[]      NOT NULL DEFAULT '{}',
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_playbook_version ───────────────────────────────────
-- Bubble: project_playbook_version data type
CREATE TABLE public.project_playbook_version (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  version_name     TEXT,
  content          TEXT,
  google_docs_url  TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_agreement_template ─────────────────────────────────
-- Bubble: project_agreement_template data type
CREATE TABLE public.project_agreement_template (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT        NOT NULL,
  type       public.os_agreement_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_agreement_version ──────────────────────────────────
-- Bubble: project_agreement_version data type
-- os_agreement_type.authorized_users_types = admin, manager, client
CREATE TABLE public.project_agreement_version (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  name             TEXT,
  content          TEXT,
  google_docs_url  TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  type             public.os_agreement_type,
  status           public.os_agreement_status NOT NULL DEFAULT 'not_available',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── project_daily_feedback ─────────────────────────────────────
-- Bubble: project_daily_feedback data type
CREATE TABLE public.project_daily_feedback (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  date             DATE        NOT NULL,
  blockers         TEXT,
  video_and_links  TEXT,
  today_work       TEXT,
  tomorrow_work    TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── feedback ───────────────────────────────────────────────────
-- Bubble: feedback data type
CREATE TABLE public.feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        REFERENCES public.project(id) ON DELETE SET NULL,
  comment    TEXT,
  rating     NUMERIC,
  user_type  public.os_user_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── client_milestone_total ─────────────────────────────────────
-- Bubble: client_milestone_total data type
-- Privacy (tabelas.md):
--   admin/manager → view all, search, auto-binding
--   developer/client/qa → view if in authorizes_users
CREATE TABLE public.client_milestone_total (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  task_milestone_id UUID        REFERENCES public.task(id)    ON DELETE SET NULL,
  name              public.os_task_name,
  real_time_h       NUMERIC,
  estimated_time_h  NUMERIC,
  authorizes_users  UUID[]      NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── qa_milestone_total ─────────────────────────────────────────
-- Bubble: qa_milestone_total data type
CREATE TABLE public.qa_milestone_total (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                 UUID        REFERENCES public.project(id) ON DELETE CASCADE,
  task_milestone_id          UUID        REFERENCES public.task(id)    ON DELETE SET NULL,
  name                       public.os_task_name,
  developer_real_time_h      NUMERIC,
  developer_estimated_time_h NUMERIC,
  qa_real_time_h             NUMERIC,
  qa_estimated_time_h        NUMERIC,
  authorizes_users           UUID[]      NOT NULL DEFAULT '{}',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── prompt ─────────────────────────────────────────────────────
-- Bubble: prompt data type (AI prompt templates)
CREATE TABLE public.prompt (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT,
  prompt_1   TEXT,
  prompt_2   TEXT,
  prompt_3   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── idea ───────────────────────────────────────────────────────
-- Bubble: idea data type
-- Privacy: admin/manager full; authorized_users read; created_by owner full
CREATE TABLE public.idea (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID        REFERENCES public.project(id)  ON DELETE SET NULL,
  created_by             UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                   TEXT        NOT NULL,
  score                  NUMERIC,
  description            TEXT,
  success_metrics        TEXT,
  authorized_users       UUID[]      NOT NULL DEFAULT '{}',
  current_block_ended    public.os_idea_block,
  current_blocks_updating TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── idea_icp ───────────────────────────────────────────────────
-- Bubble: idea_icp data type (Ideal Customer Profile)
CREATE TABLE public.idea_icp (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id                     UUID        REFERENCES public.idea(id) ON DELETE CASCADE,
  name                        TEXT,
  title                       TEXT,
  subtitle                    TEXT,
  description                 TEXT,
  day_in_life                 TEXT,
  score                       NUMERIC,
  picture                     TEXT,        -- Storage URL
  tags                        TEXT[]      NOT NULL DEFAULT '{}',
  jtbd                        TEXT,
  pitch_need                  TEXT,
  pain_points                 TEXT,
  firmographics               TEXT,
  pitch_benefit               TEXT,
  pitch_approach              TEXT,
  psychographics              TEXT,
  pitch_competition           TEXT,
  authorized_users            UUID[]      NOT NULL DEFAULT '{}',
  value_proposition_icp_pains TEXT,
  value_proposition_icp_gains TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── idea_user_type ─────────────────────────────────────────────
-- Bubble: idea_user_type data type
CREATE TABLE public.idea_user_type (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          UUID        REFERENCES public.idea(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  flows            TEXT,
  description      TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── idea_optimization_suggestion ───────────────────────────────
-- Bubble: idea_optimization_suggestion data type
CREATE TABLE public.idea_optimization_suggestion (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          UUID        REFERENCES public.idea(id)     ON DELETE CASCADE,
  icp_id           UUID        REFERENCES public.idea_icp(id) ON DELETE SET NULL,
  name             TEXT,
  description      TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── idea_block_product_definition_and_flows ────────────────────
-- Bubble: DataType Idea Block Product Definition And Flows
-- Privacy (tabelas.md — explicit rules documented):
--   everyone → no access
--   authorized_users contains current user → view all, search, view attachments
--   admin/manager → view all, search, view attachments
--   created_by (Idea's owner) → view all, search, view attachments
CREATE TABLE public.idea_block_product_definition_and_flows (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          UUID        REFERENCES public.idea(id)     ON DELETE CASCADE,
  created_by       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  summary          TEXT,
  features         TEXT,
  authorized_users UUID[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── idea_block_structure_and_align ─────────────────────────────
-- Bubble: idea_block_structure_and_align data type
CREATE TABLE public.idea_block_structure_and_align (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id                 UUID        REFERENCES public.idea(id) ON DELETE CASCADE,
  success_metrics_text    TEXT,
  product_overview_text   TEXT,
  essential_features_text TEXT,
  success_metrics         TEXT,
  target_audience         TEXT,
  core_problem            TEXT,
  authorized_users        UUID[]      NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────────
-- SECTION 4 · TRIGGERS
-- ────────────────────────────────────────────────────────────────

-- Auto-update profiles.updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────────
-- SECTION 5 · PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────────

CREATE INDEX ON public.sop             USING GIN (authorized_users);
CREATE INDEX ON public.sop             USING GIN (authorized_user_types);
CREATE INDEX ON public.sop_version     USING GIN (authorized_users);
CREATE INDEX ON public.sop_version     (sop_id);
CREATE INDEX ON public.task            USING GIN (authorized_users);
CREATE INDEX ON public.task            (project_id);
CREATE INDEX ON public.task            (parent_task_id);
CREATE INDEX ON public.task_assignees  (user_id);
CREATE INDEX ON public.project         USING GIN (authorized_users);
CREATE INDEX ON public.project         (referrer_id);
CREATE INDEX ON public.project         (status);
CREATE INDEX ON public.time_track      (owner_id);
CREATE INDEX ON public.time_track      (project_id);
CREATE INDEX ON public.qa_time_track   (project_id);
CREATE INDEX ON public.idea            USING GIN (authorized_users);
CREATE INDEX ON public.idea            (project_id);
CREATE INDEX ON public.idea_icp        (idea_id);
CREATE INDEX ON public.internal_task   (internal_project_id);
CREATE INDEX ON public.internal_task   (internal_goal_id);
CREATE INDEX ON public.internal_key_result (internal_goal_id);
CREATE INDEX ON public.talent          (user_account_id);
CREATE INDEX ON public.talent          (code);
CREATE INDEX ON public.client_milestone_total USING GIN (authorizes_users);
CREATE INDEX ON public.qa_milestone_total     USING GIN (authorizes_users);


-- ────────────────────────────────────────────────────────────────
-- SECTION 6 · ROW LEVEL SECURITY — ENABLE
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles                                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company                                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client                                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tag                                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop                                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tags                                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_version                             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_goal                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_key_result                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_project                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_project_assignees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_task                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_task_assignees                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_key_result_track               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_time_track                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent                                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_tool                             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_programming_language             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_referred_by                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_who_referred_this_talent         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project                                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task                                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_track                              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_time_track                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_file                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_link                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_video                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comment                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_playbook_version                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_agreement_template              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_agreement_version               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_daily_feedback                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback                                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_milestone_total                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_milestone_total                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt                                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea                                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_icp                                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_user_type                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_optimization_suggestion            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_block_product_definition_and_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_block_structure_and_align          ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────
-- SECTION 7 · RLS POLICIES
-- Bubble privacy rule → Supabase policy mapping.
-- Default deny: RLS is on, no permissive policy = no access.
-- ────────────────────────────────────────────────────────────────

-- ── profiles ───────────────────────────────────────────────────
-- Every user can read and update their own profile.
-- Admin/managers can read all profiles (needed to look up user types).
CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles: admin/manager read all"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_manager());

-- ── company ────────────────────────────────────────────────────
-- Bubble: admin, manager, operational can access
CREATE POLICY "company: admin/manager all"
  ON public.company FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "company: operational read"
  ON public.company FOR SELECT
  USING (public.get_user_type() = 'operational');

-- ── client ─────────────────────────────────────────────────────
-- No explicit Bubble privacy rule documented → admin/manager only
CREATE POLICY "client: admin/manager all"
  ON public.client FOR ALL
  USING (public.is_admin_or_manager());

-- ── sop_tag ────────────────────────────────────────────────────
-- Tags are visible to any authenticated user reading an accessible SOP
CREATE POLICY "sop_tag: admin/manager all"
  ON public.sop_tag FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "sop_tag: authenticated read"
  ON public.sop_tag FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── sop ────────────────────────────────────────────────────────
-- Bubble privacy rules:
--   • everyone                           → no access   (default deny)
--   • admin/manager                      → view all, search, attachments
--   • current user in authorized_users   → view all, search, attachments
--   • current user type in authorized_user_types → view all, search, attachments
CREATE POLICY "sop: admin/manager all"
  ON public.sop FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "sop: authorized user read"
  ON public.sop FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

CREATE POLICY "sop: authorized user type read"
  ON public.sop FOR SELECT
  USING (public.get_user_type() = ANY(authorized_user_types));

-- ── sop_tags (junction) ────────────────────────────────────────
CREATE POLICY "sop_tags: admin/manager all"
  ON public.sop_tags FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "sop_tags: read via sop access"
  ON public.sop_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sop s
      WHERE  s.id = sop_id
        AND (auth.uid() = ANY(s.authorized_users)
          OR public.get_user_type() = ANY(s.authorized_user_types))
    )
  );

-- ── sop_version ────────────────────────────────────────────────
-- Same privacy rules as sop (tabelas.md — sop_version Privacy Rules)
CREATE POLICY "sop_version: admin/manager all"
  ON public.sop_version FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "sop_version: authorized user read"
  ON public.sop_version FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

CREATE POLICY "sop_version: authorized user type read"
  ON public.sop_version FOR SELECT
  USING (public.get_user_type() = ANY(authorized_user_types));

-- ── internal_goal ──────────────────────────────────────────────
-- Internal OKR tables are admin/manager only (no Bubble privacy
-- rules for external users documented on these tables)
CREATE POLICY "internal_goal: admin/manager all"
  ON public.internal_goal FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_key_result ────────────────────────────────────────
CREATE POLICY "internal_key_result: admin/manager all"
  ON public.internal_key_result FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_project ───────────────────────────────────────────
CREATE POLICY "internal_project: admin/manager all"
  ON public.internal_project FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_project_assignees ─────────────────────────────────
CREATE POLICY "internal_project_assignees: admin/manager all"
  ON public.internal_project_assignees FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_task ──────────────────────────────────────────────
CREATE POLICY "internal_task: admin/manager all"
  ON public.internal_task FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_task_assignees ────────────────────────────────────
CREATE POLICY "internal_task_assignees: admin/manager all"
  ON public.internal_task_assignees FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_key_result_track ──────────────────────────────────
CREATE POLICY "internal_key_result_track: admin/manager all"
  ON public.internal_key_result_track FOR ALL
  USING (public.is_admin_or_manager());

-- ── internal_time_track ────────────────────────────────────────
-- Admin/manager full; operational users can manage their own records
CREATE POLICY "internal_time_track: admin/manager all"
  ON public.internal_time_track FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "internal_time_track: owner all"
  ON public.internal_time_track FOR ALL
  USING (owner_id = auth.uid() AND public.is_operational_user());

-- ── talent ─────────────────────────────────────────────────────
CREATE POLICY "talent: admin/manager all"
  ON public.talent FOR ALL
  USING (public.is_admin_or_manager());

-- Talent can read their own profile record
CREATE POLICY "talent: own read"
  ON public.talent FOR SELECT
  USING (user_account_id = auth.uid());

-- ── talent_tool ────────────────────────────────────────────────
CREATE POLICY "talent_tool: admin/manager all"
  ON public.talent_tool FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "talent_tool: own read"
  ON public.talent_tool FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.talent t
      WHERE  t.id = talent_id AND t.user_account_id = auth.uid()
    )
  );

-- ── talent_programming_language ────────────────────────────────
CREATE POLICY "talent_prog_lang: admin/manager all"
  ON public.talent_programming_language FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "talent_prog_lang: own read"
  ON public.talent_programming_language FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.talent t
      WHERE  t.id = talent_id AND t.user_account_id = auth.uid()
    )
  );

-- ── talent_referred_by ─────────────────────────────────────────
CREATE POLICY "talent_referred_by: admin/manager all"
  ON public.talent_referred_by FOR ALL
  USING (public.is_admin_or_manager());

-- ── client_who_referred_this_talent ────────────────────────────
CREATE POLICY "cwrtt: admin/manager all"
  ON public.client_who_referred_this_talent FOR ALL
  USING (public.is_admin_or_manager());

-- ── project ────────────────────────────────────────────────────
-- Bubble privacy rules (tabelas.md):
--   everyone                  → no access
--   referrer                  → search only, limited fields, only own referred projects
--   admin/manager             → view all, search, attachments
--   developer/client/qa       → search (all fields), only when in authorized_users
CREATE POLICY "project: admin/manager all"
  ON public.project FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project: referrer read own"
  ON public.project FOR SELECT
  USING (
    public.get_user_type() = 'referrer'
    AND referrer_id = auth.uid()
  );

CREATE POLICY "project: operational read authorized"
  ON public.project FOR SELECT
  USING (
    public.is_operational_user()
    AND auth.uid() = ANY(authorized_users)
  );

-- ── task ───────────────────────────────────────────────────────
-- Admin/manager full; operational users only when in authorized_users
CREATE POLICY "task: admin/manager all"
  ON public.task FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "task: authorized user read"
  ON public.task FOR SELECT
  USING (
    public.is_operational_user()
    AND auth.uid() = ANY(authorized_users)
  );

-- ── task_assignees ─────────────────────────────────────────────
CREATE POLICY "task_assignees: admin/manager all"
  ON public.task_assignees FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "task_assignees: read if task accessible"
  ON public.task_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.task t
      WHERE  t.id = task_id
        AND auth.uid() = ANY(t.authorized_users)
    )
  );

-- ── time_track ─────────────────────────────────────────────────
-- Bubble: admin/manager full; developer/client/qa full access
CREATE POLICY "time_track: admin/manager all"
  ON public.time_track FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "time_track: operational all"
  ON public.time_track FOR ALL
  USING (public.is_operational_user());

-- ── qa_time_track ──────────────────────────────────────────────
CREATE POLICY "qa_time_track: admin/manager all"
  ON public.qa_time_track FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "qa_time_track: operational all"
  ON public.qa_time_track FOR ALL
  USING (public.is_operational_user());

-- ── project_file ───────────────────────────────────────────────
CREATE POLICY "project_file: admin/manager all"
  ON public.project_file FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_file: authorized user read"
  ON public.project_file FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── project_link ───────────────────────────────────────────────
CREATE POLICY "project_link: admin/manager all"
  ON public.project_link FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_link: authorized user read"
  ON public.project_link FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── project_video ──────────────────────────────────────────────
CREATE POLICY "project_video: admin/manager all"
  ON public.project_video FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_video: authorized user read"
  ON public.project_video FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── task_comment ───────────────────────────────────────────────
CREATE POLICY "task_comment: admin/manager all"
  ON public.task_comment FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "task_comment: authorized user read"
  ON public.task_comment FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- Comment owner can insert, update, delete their own
CREATE POLICY "task_comment: owner insert"
  ON public.task_comment FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "task_comment: owner modify"
  ON public.task_comment FOR ALL
  USING (owner_id = auth.uid());

-- ── project_playbook_version ───────────────────────────────────
CREATE POLICY "project_playbook_version: admin/manager all"
  ON public.project_playbook_version FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_playbook_version: authorized user read"
  ON public.project_playbook_version FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── project_agreement_template ─────────────────────────────────
-- Admin/manager only — templates are internal
CREATE POLICY "project_agreement_template: admin/manager all"
  ON public.project_agreement_template FOR ALL
  USING (public.is_admin_or_manager());

-- ── project_agreement_version ──────────────────────────────────
-- os_agreement_type authorized_users_types = admin, manager, client
CREATE POLICY "project_agreement_version: admin/manager all"
  ON public.project_agreement_version FOR ALL
  USING (public.is_admin_or_manager());

-- Client can read if they are in authorized_users
CREATE POLICY "project_agreement_version: client read"
  ON public.project_agreement_version FOR SELECT
  USING (
    public.get_user_type() = 'client'
    AND auth.uid() = ANY(authorized_users)
  );

-- ── project_daily_feedback ─────────────────────────────────────
CREATE POLICY "project_daily_feedback: admin/manager all"
  ON public.project_daily_feedback FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "project_daily_feedback: authorized user read"
  ON public.project_daily_feedback FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── feedback ───────────────────────────────────────────────────
CREATE POLICY "feedback: admin/manager all"
  ON public.feedback FOR ALL
  USING (public.is_admin_or_manager());

-- Operational users can submit feedback
CREATE POLICY "feedback: operational insert"
  ON public.feedback FOR INSERT
  WITH CHECK (public.is_operational_user());

-- ── client_milestone_total ─────────────────────────────────────
-- Bubble (tabelas.md):
--   admin/manager → view all, search, auto-binding
--   developer/client/qa → view if in authorizes_users
CREATE POLICY "client_milestone_total: admin/manager all"
  ON public.client_milestone_total FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "client_milestone_total: authorized user read"
  ON public.client_milestone_total FOR SELECT
  USING (
    public.is_operational_user()
    AND auth.uid() = ANY(authorizes_users)
  );

-- ── qa_milestone_total ─────────────────────────────────────────
CREATE POLICY "qa_milestone_total: admin/manager all"
  ON public.qa_milestone_total FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "qa_milestone_total: authorized user read"
  ON public.qa_milestone_total FOR SELECT
  USING (auth.uid() = ANY(authorizes_users));

-- ── prompt ─────────────────────────────────────────────────────
-- AI prompt templates are internal
CREATE POLICY "prompt: admin/manager all"
  ON public.prompt FOR ALL
  USING (public.is_admin_or_manager());

-- ── idea ───────────────────────────────────────────────────────
-- Bubble (idea_block_product_definition_and_flows privacy rules
-- serve as the template for all idea-related tables):
--   everyone → no access
--   authorized_users contains current user → view all, search, attachments
--   admin/manager → view all, search, attachments
--   created_by (Idea's owner) → view all, search, attachments
CREATE POLICY "idea: admin/manager all"
  ON public.idea FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea: authorized user read"
  ON public.idea FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

CREATE POLICY "idea: owner all"
  ON public.idea FOR ALL
  USING (created_by = auth.uid());

-- ── idea_icp ───────────────────────────────────────────────────
CREATE POLICY "idea_icp: admin/manager all"
  ON public.idea_icp FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_icp: authorized user read"
  ON public.idea_icp FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── idea_user_type ─────────────────────────────────────────────
CREATE POLICY "idea_user_type: admin/manager all"
  ON public.idea_user_type FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_user_type: authorized user read"
  ON public.idea_user_type FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── idea_optimization_suggestion ───────────────────────────────
CREATE POLICY "idea_optimization_suggestion: admin/manager all"
  ON public.idea_optimization_suggestion FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_optimization_suggestion: authorized user read"
  ON public.idea_optimization_suggestion FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- ── idea_block_product_definition_and_flows ────────────────────
-- Source: tabelas.md — "Idea Block Product Definition And Flows - Privacy Rules"
-- (the only table with fully documented per-rule detail)
CREATE POLICY "idea_block_pdef: admin/manager all"
  ON public.idea_block_product_definition_and_flows FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_block_pdef: authorized user read"
  ON public.idea_block_product_definition_and_flows FOR SELECT
  USING (auth.uid() = ANY(authorized_users));

-- Idea's owner (Created By)
CREATE POLICY "idea_block_pdef: owner all"
  ON public.idea_block_product_definition_and_flows FOR ALL
  USING (created_by = auth.uid());

-- ── idea_block_structure_and_align ─────────────────────────────
CREATE POLICY "idea_block_structure: admin/manager all"
  ON public.idea_block_structure_and_align FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_block_structure: authorized user read"
  ON public.idea_block_structure_and_align FOR SELECT
  USING (auth.uid() = ANY(authorized_users));


-- ================================================================
-- END OF MIGRATION
-- ================================================================
-- Tables:  39
-- Enums:   24
-- Policies: 70+
-- Indexes:  22
-- ================================================================
