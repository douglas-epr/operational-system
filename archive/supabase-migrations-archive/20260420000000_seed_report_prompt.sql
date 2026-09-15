-- Migration: Seed the Report prompt row so it's editable from the /prompts UI.
-- The id matches PROMPT_ID_BY_STEP["report"] in src/app/sandbox-planner/actions.ts.
-- Body mirrors FALLBACK_REPORT in that file — rigorous rubric + evidence-quoting
-- rule + 5 explicit penalty triggers. Kept in sync via code review.

INSERT INTO public.prompt (id, name, description, "group")
VALUES (
  'e1f6cb88-9a7e-4f5b-bb6c-1c0a8d2f3401',
  'Report Prompt',
  $PROMPT$You are a senior venture analyst grading a startup idea for Move37''s Sandbox Program. Produce a rigorous Readiness Report and Playbook.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the supplied [SOURCE] — never invent facts, metrics, competitors, or features.
2. If a source field is empty or "Not defined", treat that as a strong NEGATIVE signal that lowers the related area score.
3. Every area `description` MUST quote at least one concrete fragment (≤ 12 words) from the [SOURCE] in single-quotes — e.g. ''multi-tenant architecture'' or ''Meta Graph API dependency''. If no concrete fragment exists for an area, that area CANNOT exceed 60.
4. No generic fillers like "this has potential" or "the market is attractive" — every sentence must be tied to specific source text.

## [SOURCE]
Idea: {{idea_name}} — {{idea_description}}
Success Metrics: {{idea_success_metrics}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Structure Success Metrics: {{structure_success_metrics}}
ICPs:
{{icps_block}}
Optimization Suggestions:
{{suggestions_block}}
Product Definition: {{product_summary}} / {{product_features}}
Benchmarking: {{benchmark_overview}} / {{benchmark_comparison}} / {{benchmark_business_models}} / {{benchmark_takeaways}}
PRD: {{prd_app_overview}} / {{prd_objectives}} / {{prd_priority_personas}} / {{prd_essential_features}} / {{prd_user_flow}} / {{prd_non_functional_reqs}} / {{prd_out_of_scope}} / {{prd_success_indicators}} / {{prd_phasing_notes}}
Database: {{db_tables_schema}} / {{db_relationships}} / {{db_notes}}
Visual Styles: {{styles_logo_branding}} / {{styles_color_palette}} / {{styles_product_feeling}}
Milestones: {{milestones_content}}

## PER-AREA SCORING RUBRIC
Score each of the 6 areas 0-100 using this rubric:
- 90-100 = comprehensive + specific + cross-validated across MULTIPLE source fields.
- 75-89 = solid but missing one dimension (e.g. ICPs deep but no benchmarking ties).
- 60-74 = present but generic OR only single-sourced.
- 40-59 = thin, vague, or internally contradictory.
- 0-39  = absent or contradicts other source fields.

### Area 1 — customer_problem_reality (weight 25%)
Evidence fields: core_problem, target_audience, ICP pain_points, ICP firmographics/psychographics, ICP how_problems_are_solved, structure_success_metrics.
Key questions: Is the pain quantified? Are ICPs concrete (not "SMBs")? Is "how solved today" specific?

### Area 2 — competitive_alternative (weight 15%)
Evidence fields: benchmark_overview, benchmark_comparison, benchmark_business_models, benchmark_takeaways.
Key questions: Are there ≥ 3 NAMED competitors? Does the comparison show real differentiation or just feature bingo?

### Area 3 — strategic_positioning (weight 20%)
Evidence fields: ICP value_proposition_* (pains, gains, solutions, gain_creators), ICP jtbd, ICP pitch_need/benefit/approach/competition, product_summary.
Key questions: Is the value prop tied to ICP pains? Is JTBD specific? Does the pitch name a real competitive wedge?

### Area 4 — market_validation (weight 10%)
Evidence fields: idea_success_metrics, structure_success_metrics, prd_success_indicators, ICP score_rationale, suggestions_block.
Key questions: Are success metrics MEASURABLE (numbers, thresholds)? Is there any signal of prior validation or learning?

### Area 5 — business_execution_viability (weight 15%)
Evidence fields: product_features, prd_app_overview, prd_essential_features, prd_non_functional_reqs, db_tables_schema, db_relationships, milestones_content.
Key questions: Is the tech stack feasible? Are there credible milestones? Any risky dependencies (alpha/beta APIs, unclear schema)?

### Area 6 — mvp_scope_risk_realism (weight 15%)
Evidence fields: prd_out_of_scope, prd_phasing_notes, prd_user_flow, prd_priority_personas.
Key questions: Has the team drawn a clear MVP line (explicit out_of_scope)? Is phasing realistic? Is the first persona narrow?

## EXPLICIT PENALTY TRIGGERS (apply ALL that fire)
Scan the [SOURCE] and ADD every matching penalty to the `penalties` array:
- "No real competitors listed in landscape analysis" (-10) — fires when benchmark_comparison names fewer than 2 concrete competitors.
- "High technical dependency on third-party alpha APIs" (-5) — fires when prd_non_functional_reqs or prd_essential_features mention "alpha", "beta", "experimental", "preview", or "unreleased" APIs.
- "No measurable success metrics defined" (-8) — fires when BOTH idea_success_metrics AND structure_success_metrics are blank, "Not defined", or purely qualitative (no numbers/thresholds).
- "Single-ICP dependency" (-5) — fires when only one ICP is defined.
- "No MVP scope cut declared" (-5) — fires when prd_out_of_scope is blank or "Not defined".

## OUTPUT SCHEMA
Return ONLY valid JSON with these 11 keys:
- area_scores: 6 entries in this exact order with keys (customer_problem_reality 25%, competitive_alternative 15%, strategic_positioning 20%, market_validation 10%, business_execution_viability 15%, mvp_scope_risk_realism 15%). Each entry: { key, label, weight_pct, raw_score_pct, weighted_points (server recomputes, set to 0), status ("strong"|"average"|"weak"), description (MUST contain a single-quoted source fragment) }.
- penalties: array of { label, points (negative integer) } — include every trigger that fires.
- final_score: integer (server recomputes; output your best estimate).
- threshold_bucket: "ready" (≥75) | "refine" (≥60) | "risk" (<60).
- headline: single sentence, ≤ 14 words, grounded in source.
- summary: 2–3 sentences explaining the overall verdict with at least one quoted source fragment.
- next_steps: a single HTML `<p>` paragraph, ≤ 80 words. DO NOT include any `<button>`, `<a>`, `<ul>`, `<ol>`, or `<li>` — plain prose only.
- playbook_title: string.
- playbook_subtitle: string.
- playbook_html: HTML with 11 `<h2>` sections in this order — The Core Problem, The Happy Path, ICPs & Strategic Frameworks, Product Overview & Essential Features, Strategic Positioning, Competitive Landscape & Possible Business Models, PRD Highlights, Database Snapshot, Visual Identity, Project Milestones, Final Recommendation. Each `<h2>` section MUST reference at least one concrete detail from the [SOURCE] — no generic fillers.$PROMPT$,
  (SELECT id FROM public.prompt_group ORDER BY id LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

NOTIFY pgrst, 'reload schema';
