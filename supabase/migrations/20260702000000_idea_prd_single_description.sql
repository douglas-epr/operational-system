-- Collapse the PRD into a single rich-HTML document.
--
-- Rationale: the multi-column PRD (app_overview, objectives, priority_personas,
-- essential_features, user_flow, features_per_page, non_functional_reqs,
-- out_of_scope, success_indicators, phasing_notes) produced a thin, fragmented
-- document. We now generate ONE comprehensive, build-ready PRD — modelled on a
-- best-in-class external PRD that includes per-feature "tools used", connected
-- platform integrations, a phased delivery plan, and a tooling inventory — and
-- store it in a single `idea_prd.description` column.
--
-- This migration:
--   1. Adds `description` (text).
--   2. Backfills it from the existing per-section columns so no current PRD is
--      lost (each non-empty section is wrapped in its <h2> heading).
--   3. Drops the ten per-section text columns.
--   4. Re-seeds the PRD prompt to emit a single `description` HTML document.
-- Idempotent / append-only per project rules.

-- 1. New single-document column.
ALTER TABLE public.idea_prd
  ADD COLUMN IF NOT EXISTS description text;

-- 2. Backfill from the old columns (only where description is still empty).
UPDATE public.idea_prd SET description =
  NULLIF(
    concat_ws(E'\n',
      CASE WHEN coalesce(app_overview,'')        <> '' THEN '<h2>App Overview</h2>'                || app_overview        END,
      CASE WHEN coalesce(objectives,'')          <> '' THEN '<h2>Objectives</h2>'                  || objectives          END,
      CASE WHEN coalesce(priority_personas,'')   <> '' THEN '<h2>Priority Personas</h2>'           || priority_personas    END,
      CASE WHEN coalesce(essential_features,'')  <> '' THEN '<h2>Essential Features</h2>'          || essential_features   END,
      CASE WHEN coalesce(user_flow,'')           <> '' THEN '<h2>Main User Flow</h2>'              || user_flow            END,
      CASE WHEN coalesce(features_per_page,'')   <> '' THEN '<h2>Features per Page</h2>'           || features_per_page    END,
      CASE WHEN coalesce(non_functional_reqs,'') <> '' THEN '<h2>Non-Functional Requirements</h2>' || non_functional_reqs  END,
      CASE WHEN coalesce(out_of_scope,'')        <> '' THEN '<h2>Out of Scope</h2>'                || out_of_scope         END,
      CASE WHEN coalesce(success_indicators,'')  <> '' THEN '<h2>Success Metrics</h2>'             || success_indicators   END,
      CASE WHEN coalesce(phasing_notes,'')       <> '' THEN '<h2>Phasing Notes</h2>'               || phasing_notes        END
    ),
    ''
  )
WHERE description IS NULL OR description = '';

-- 3. Drop the per-section columns (features_per_page added in 20260625000000).
ALTER TABLE public.idea_prd
  DROP COLUMN IF EXISTS app_overview,
  DROP COLUMN IF EXISTS objectives,
  DROP COLUMN IF EXISTS priority_personas,
  DROP COLUMN IF EXISTS essential_features,
  DROP COLUMN IF EXISTS user_flow,
  DROP COLUMN IF EXISTS features_per_page,
  DROP COLUMN IF EXISTS non_functional_reqs,
  DROP COLUMN IF EXISTS out_of_scope,
  DROP COLUMN IF EXISTS success_indicators,
  DROP COLUMN IF EXISTS phasing_notes;

-- 4. Re-seed the PRD prompt to produce one comprehensive PRD document.
--    Mirrors FALLBACK_PRD in src/app/ideas-refiner/actions.ts.
INSERT INTO public.prompt (id, name, description, "group")
VALUES (
  '5041e57c-a50c-4468-b154-bf240528b617',
  'PRD Prompt',
  $prompt$You are a senior product manager writing a single, comprehensive, build-ready Product Requirements Document (PRD) for an engineering team that will code this application with Claude Code on a Next.js + Supabase + Tailwind stack. Produce ONE cohesive document — concrete, technical, and free of marketing fluff.

## PRIMARY SOURCE OF TRUTH — IDEA DESCRIPTION
idea_description is the founder's complete product vision. It is your GROUND TRUTH:
- Do NOT omit any feature, user type, workflow, integration, tool, platform, or use case explicitly named in idea_description.
- If idea_description names specific tools, services, APIs, models, or open-source repos, you MUST carry them through into the relevant feature areas, the tooling inventory, and the phased plan.
- If idea_description and the other discovery fields conflict on product intent, prefer idea_description.

## FULL CONTEXT (all prior discovery steps)
Idea: {{idea_name}} — {{idea_description}}
Agreed Problem (from go/no-go debate): {{agreed_problem}}
Agreed Solution (from go/no-go debate): {{agreed_solution}}
Recommendation: {{recommendation}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}
Features: {{features}}
ICP names: {{icp_names}}
ICP details:
{{icp_details}}
Benchmarking:
{{benchmarking}}
Location & Legislation:
{{location_legislation}}
Market Opportunity:
{{market_opportunity}}
Risk & Validation:
{{risk_and_validation}}

## CRITICAL CONCEPT DISTINCTION
"Personas" (a.k.a. User Types) are a TECHNICAL concept: the functional roles that log into and operate the application (e.g. Admin, Operator, Creator, Client, Guest). They are NOT the marketing ICPs / target-audience segments. Derive personas from how the app actually works.

## DOCUMENT STRUCTURE — produce ALL of these sections, in this order, as rich HTML
Use <h2> for each numbered section heading and <h3> for sub-sections. Use <ul>/<li>, <strong>, <table> where it aids clarity.

[1] Project Name — the product name and a one-line working title.
[2] App Overview — what it is, what it is explicitly NOT, the core workflow, the primary platform (web/mobile), and the launch market. Ground every claim in idea_description.
[3] Objectives of Version 1 (v1) — the concrete, measurable goals of the first build.
[4] Priority Personas — each technical user type, a one-line role description, and their main actions/permissions inside the product.
[5] Essential MVP Features — the heart of the document. For EACH feature area provide:
   - <strong>Purpose</strong>: one line.
   - <strong>Must include</strong>: a bullet list of concrete capabilities.
   - <strong>Tools used in this area</strong>: a bullet list naming the specific tools/services/APIs/models that power this feature (drawn from idea_description and the stack). THIS IS MANDATORY for every feature area.
   - <strong>MVP outcome</strong>: one line on what "done" looks like.
[6] Main User Flow — the end-to-end core flow for the primary persona(s), as an ordered list, noting which tool handles each step.
[7] Non-Functional Requirements — include these sub-sections:
   - Platform & Access (platform, primary usage model, mobile priority, launch market).
   - <strong>Core Runtime Tooling</strong>: a bullet list of every runtime tool/service with a one-line role for each.
   - <strong>Open-Source / Forked Repositories</strong>: any open-source repos to fork/self-host (name, URL if given in idea_description, role). Omit only if none are implied.
   - <strong>Connected Platform Integrations</strong>: the external platforms/APIs the product publishes to or reads from, each with its integration approach and any compliance constraint. Use an HTML table when there are several.
   - Security & Access Rules, Data & Auditability, Performance & Reliability, Content Governance.
[8] Out of Scope for v1 — what is explicitly excluded, and why.
[9] Success Metrics for v1 — measurable indicators of a successful first build.
[10] Suggested v1 Delivery Scope by Phase — a phased build plan (Phase 1, Phase 2, …). For EACH phase list what to build and the <strong>Main tools involved</strong>. End with a "Tooling Inventory" recap and a "Final MVP Definition" paragraph.

## OUTPUT
Return a JSON object with EXACTLY one key:
- "description": the ENTIRE PRD as a single valid rich-HTML string covering all 10 sections above.

Return ONLY valid JSON with no markdown fences.$prompt$,
  9
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      "group"     = EXCLUDED."group";
