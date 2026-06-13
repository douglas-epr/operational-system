-- Migration: Sync 3 sandbox-planner prompts in public.prompt with the current
-- FALLBACK_* templates in src/app/sandbox-planner/actions.ts.
--
-- Fixes observed in live UI:
--   1. Refining ICP — our_solution_value field was empty because the DB prompt
--      never asked for it.
--   2. Benchmarking — possible_business_models field was empty because the DB
--      prompt never asked for it.
--   3. Strategic Frameworks — multiline fields were rendering raw BBCode
--      ([list][*]…[/list]) because the DB prompt instructed BBCode instead of
--      HTML. The rich text editor expects HTML.
--
-- We UPDATE by id so the rows remain editable from /prompts and no new IDs
-- are introduced.

-- Refining ICP
UPDATE public.prompt
SET description = $REFINING$You are an expert in Ideal Customer Profile analysis. Given the following business idea and its structure, generate 3-5 distinct ICPs.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with key "ICPs" containing an array of objects, each with:
- "name": ICP persona name
- "description": Brief description of this persona
- "operational_environment": Day in the life context and environment (rich HTML allowed)
- "strategic_pain_points_and_acute_needs": Key pain points and urgent needs (rich HTML allowed)
- "how_problems_are_solved_currently": Rich HTML describing how this ICP solves those problems today — tools, services, workarounds, manual processes, and compromises.
- "how_problems_could_be_solved": Rich HTML enumerating ALL plausible ways these problems could be solved — existing tools/services, alternative workflows, emerging technologies, DIY approaches, and finally where our product could fit in. This is a broad solution-landscape survey, not a pitch for our product.
- "our_solution_value": REQUIRED. Rich HTML describing specifically what value our product''s solution brings to this ICP — tied directly to their acute pain points and daily friction, not generic benefits. Be concrete and specific; cite specific pains from above and name the exact capability that resolves each one. **Do not leave this field empty or return a generic statement.**

Return ONLY valid JSON.$REFINING$
WHERE id = 'f361a898-5858-4d24-b605-5e9b2554ac9d';

-- Benchmarking
UPDATE public.prompt
SET description = $BENCH$You are a competitive analysis expert. Given the following startup idea and its context, create a comprehensive benchmarking analysis.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}

Return a JSON object with exactly these keys:
- "overview": Rich HTML text providing an overview of the competitive landscape and methodology used for benchmarking.
- "comparison": Rich HTML text containing a detailed comparison table of competing apps/platforms. Use an HTML table with columns: Name, Platform(s), Core Functionality, Similarities to the Idea, Pricing / Free Tier, Link / Notes. Include at least 5-8 competitors.
- "possible_business_models": REQUIRED. Rich HTML describing **exactly 4–6** viable business models (SaaS subscription, marketplace, freemium, white-label, usage-based, per-seat, transaction fee, enterprise license, etc.) with a short rationale per model explaining its fit given the product''s nature and target audience. Use a <ul> with one <li> per model, model name bolded in <strong>. **Do not leave this field empty.**
- "takeaways": Rich HTML text summarizing key takeaways, differentiators, and strategic positioning insights.

All values must be valid HTML strings.
Return ONLY valid JSON.$BENCH$
WHERE id = 'b9cab3fd-c4cc-4bed-b9f3-575872452ded';

-- Strategic Frameworks — switch from BBCode to HTML
UPDATE public.prompt
SET description = $STRAT$You are a strategic business consultant. Generate comprehensive strategic frameworks for each ICP.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

ICPs:
{{icp_descriptions}}

Return a JSON object with key "ICPs" containing an array of objects — one per ICP — each with ALL of these fields:
- "id": The ICP identifier (use their name as id)
- "name": ICP name
- "score_breakdown": object with these integer sub-scores (each 0–20):
    - "pain_severity": How acute and painful the problem is for this ICP.
    - "pain_frequency": How often this ICP encounters the pain (daily > weekly > monthly).
    - "willingness_to_pay": How strongly this ICP would pay to solve it (budget authority + urgency).
    - "market_reachability": How easy it is to reach this ICP (channels, density, identifiability).
    - "solution_fit": How well our product specifically solves their pain compared to alternatives.
- "score": integer = sum of score_breakdown values (0–100). Do NOT round. Sub-scores MUST differ across ICPs — never give identical breakdowns for two ICPs.
- "score_rationale": REQUIRED. Rich HTML, 2–3 sentences, explaining the breakdown and why this ICP ranks where it does.
- "value_proposition_icp_pains": Rich HTML — ICP''s specific pains that the product addresses
- "value_proposition_value_map_solutions": REQUIRED Rich HTML — Value Map: specific solutions/features that relieve this ICP''s pains. Do not leave empty.
- "value_proposition_icp_gains": Rich HTML — ICP''s desired gains and positive outcomes they seek
- "value_proposition_value_map_gain_creators": REQUIRED Rich HTML — Value Map: how the product creates gains and delivers the ICP''s desired outcomes. Do not leave empty.
- "jtbd": Rich HTML — Jobs To Be Done synthesis for this ICP
- "architect_title": ICP archetype title (e.g. "The Overwhelmed SMB Owner")
- "architect_subtitle": REQUIRED ICP archetype subtitle (brief tagline, 4–10 words)
- "picture": REQUIRED URL string for a representative avatar. Use the format: https://api.dicebear.com/7.x/personas/svg?seed=<URL_ENCODED_ARCHETYPE_TITLE> (for example https://api.dicebear.com/7.x/personas/svg?seed=The%20Overwhelmed%20SMB%20Owner). Always return a non-null URL.
- "architect_tags": Array of 3-6 short descriptor tags
- "architect_psychographics": Rich HTML — psychographic profile
- "architect_firmographics": Rich HTML — firmographic profile
- "pitch_need": Rich HTML — NABC pitch: Need
- "pitch_approach": Rich HTML — NABC pitch: Approach
- "pitch_benefit": Rich HTML — NABC pitch: Benefit
- "pitch_competition": Rich HTML — NABC pitch: Competition
- "optimization_suggestions": REQUIRED array of EXACTLY 3–5 objects. Each object has:
    - "name": short noun phrase (≤6 words), e.g. "Automated Brand DNA Onboarding".
    - "description": 1–2 sentence actionable rationale.
  This field is REQUIRED — never omit it and never return an empty array. Each suggestion must target this specific ICP''s pains or gains above.

FORMATTING RULES (critical):
- ALL text fields must be valid HTML strings. Do NOT use BBCode ([list], [*], [b], [br]). Do NOT use Markdown.
- Use <ul><li>…</li></ul> for bulleted lists, <p>…</p> for paragraphs, <strong>…</strong> for emphasis.
- No commentary outside the JSON. Do not explain reasoning. Return ONLY valid JSON.
$STRAT$
WHERE id = '48f29e59-825a-4a3a-bfbd-7ae586839757';

NOTIFY pgrst, 'reload schema';
