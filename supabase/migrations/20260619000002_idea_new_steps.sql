-- Add location + jurisdiction to idea table (Step A)
ALTER TABLE public.idea ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.idea ADD COLUMN IF NOT EXISTS jurisdiction text;

-- Extend the enum with the 3 new step values
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'location_legislation' AFTER 'product_definition_flows';
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'market_opportunity' AFTER 'location_legislation';
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'risk_and_validation' AFTER 'report';

-- ── Table: idea_location_legislation ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.idea_location_legislation (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id                uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  regulatory_bodies      text,
  key_legislation        text,
  licensing_requirements text,
  data_privacy_rules     text,
  compliance_timeline    text,
  regulatory_moat        text,
  red_flags              text,
  created_at             timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.idea_location_legislation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idea_location_legislation: admin/manager all"
  ON public.idea_location_legislation FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_location_legislation: idea creator all"
  ON public.idea_location_legislation FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_id AND i.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_id AND i.created_by = auth.uid())
  );

CREATE POLICY "idea_location_legislation: project member read"
  ON public.idea_location_legislation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_id AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── Table: idea_market_opportunity ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.idea_market_opportunity (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id              uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  tam_description      text,
  tam_estimate         text,
  sam_description      text,
  sam_estimate         text,
  som_description      text,
  som_estimate         text,
  data_sources         text,
  segment_filter_logic text,
  growth_drivers       text,
  market_risks         text,
  created_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.idea_market_opportunity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idea_market_opportunity: admin/manager all"
  ON public.idea_market_opportunity FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_market_opportunity: idea creator all"
  ON public.idea_market_opportunity FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_id AND i.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_id AND i.created_by = auth.uid())
  );

CREATE POLICY "idea_market_opportunity: project member read"
  ON public.idea_market_opportunity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_id AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── Table: idea_risk_and_validation ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.idea_risk_and_validation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  risk_register   jsonb,
  validation_test jsonb,
  why_we_win      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.idea_risk_and_validation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idea_risk_and_validation: admin/manager all"
  ON public.idea_risk_and_validation FOR ALL
  USING (public.is_admin_or_manager());

CREATE POLICY "idea_risk_and_validation: idea creator all"
  ON public.idea_risk_and_validation FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_id AND i.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.idea i WHERE i.id = idea_id AND i.created_by = auth.uid())
  );

CREATE POLICY "idea_risk_and_validation: project member read"
  ON public.idea_risk_and_validation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.idea i
      JOIN public.project p ON p.id = i.project_id
      WHERE i.id = idea_id AND auth.uid() = ANY(p.authorized_users)
    )
  );

-- ── Prompt rows (group 9 = SandBox Planner) ──────────────────────────────────

INSERT INTO prompt (id, name, description, "group")
VALUES (
  'bb000001-0000-4000-8000-000000000001',
  'Location & Legislation Research Prompt',
  'You are a regulatory research expert. Given the following startup idea and its target location/jurisdiction, perform a comprehensive regulatory and legal landscape analysis.

CRITICAL RULES:
- Base all analysis on the provided location and jurisdiction.
- If location is "Not specified", state that analysis cannot be performed without location data and explain what is needed.
- Label each claim: [Fact] = well-established law or published regulation; [Inference] = logical deduction; [Uncertain] = needs legal counsel.
- Output ONLY valid JSON — no markdown fences, no extra keys.

SOURCE DATA:
Idea: {{idea_name}}
Description: {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}

Return a JSON object with exactly these keys:

"regulatory_bodies": Rich HTML — the key regulatory bodies, agencies, or authorities that govern this type of business in the given jurisdiction. Include their names, roles, and reference links where known.

"key_legislation": Rich HTML — the primary laws, acts, directives, or regulations that apply. For each: name, jurisdiction scope, what it governs, and compliance date if relevant.

"licensing_requirements": Rich HTML — any licenses, permits, certifications, or registrations required to operate legally. For each: name, issuing body, estimated cost/time, and renewal cycle.

"data_privacy_rules": Rich HTML — applicable data protection laws (e.g. GDPR, LGPD, CCPA, PDPA). For each: scope, key obligations, penalties for non-compliance.

"compliance_timeline": Rich HTML — a sequenced compliance roadmap using an HTML table with columns: Stage | Action Required | Timeframe | Owner.

"regulatory_moat": Rich HTML — any regulatory advantages or moats the compliance effort creates (e.g. harder for competitors to enter, trust signal for customers, barrier to clone).

"red_flags": Rich HTML — critical compliance risks, potential blockers, or areas requiring specialist legal advice before launch. Label severity: Critical / High / Medium.

All values must be valid HTML strings. Return ONLY valid JSON.',
  9
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      "group"     = EXCLUDED."group";

INSERT INTO prompt (id, name, description, "group")
VALUES (
  'bb000002-0000-4000-8000-000000000001',
  'Market Opportunity & Sizing Prompt',
  'You are a market sizing expert and business analyst. Given the following startup idea and its context, produce a rigorous market opportunity analysis using TAM/SAM/SOM methodology.

CRITICAL RULES:
- Ground all estimates in named, real data sources. Label each cell: [Fact], [Inference], or [Uncertain].
- If location/jurisdiction is "Not specified", perform a global analysis and note the limitation.
- Do NOT fabricate market figures. If data is unavailable, say so and explain the gap.
- Output ONLY valid JSON — no markdown fences, no extra keys.

SOURCE DATA:
Idea: {{idea_name}}
Description: {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}
ICP Firmographics:
{{icps_block}}
Product Overview: {{product_overview}}
Business Model: {{business_model}}

Return a JSON object with exactly these keys:

"tam_description": Rich HTML — Total Addressable Market definition: the broadest universe of potential customers (globally or in the relevant scope) who experience the core problem.

"tam_estimate": Rich HTML — TAM estimate with named source or methodology. Label [Fact], [Inference], or [Uncertain].

"sam_description": Rich HTML — Serviceable Addressable Market: the segment of TAM reachable given your product type, geography, and go-to-market approach.

"sam_estimate": Rich HTML — SAM estimate with source and rationale for the reduction from TAM.

"som_description": Rich HTML — Serviceable Obtainable Market: realistic market share achievable in years 1–3 given resource constraints and competition.

"som_estimate": Rich HTML — SOM estimate with specific assumptions (conversion rate, CAC, team size, channel capacity).

"data_sources": Rich HTML — bulleted list of all data sources referenced. For each: source name, URL or publication, date, and which estimate it informed.

"segment_filter_logic": Rich HTML — filter logic applied at each step of TAM → SAM → SOM. Use an HTML table: Layer | Filter Applied | Reduction Factor | Resulting Size.

"growth_drivers": Rich HTML — 3–5 macro forces expanding this market. For each: driver name, mechanism, and impact direction (accelerating / stable / uncertain).

"market_risks": Rich HTML — 3–5 macro forces that could suppress this market. For each: risk name, mechanism, and probability (High / Medium / Low).

All values must be valid HTML strings. Return ONLY valid JSON.',
  9
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      "group"     = EXCLUDED."group";

INSERT INTO prompt (id, name, description, "group")
VALUES (
  'bb000003-0000-4000-8000-000000000001',
  'Risk Register & Validation Test Prompt',
  'You are a risk management expert and startup validation specialist. Given the following startup idea and its evaluation context, produce a structured risk register, a lean validation experiment, and a competitive advantage analysis.

CRITICAL RULES:
- Draw all risks from evidence in the source data (report verdict, benchmarking takeaways, regulatory gaps, ICP friction). Do not fabricate risks.
- Label each risk item: [Fact], [Inference], or [Speculation].
- The validation test budget must be realistic for an early-stage startup (£3,000–£5,000 default unless cost data suggests otherwise).
- Output ONLY valid JSON — no markdown fences, no extra keys.

SOURCE DATA:
Agreed Problem: {{agreed_problem}}
Agreed Solution: {{agreed_solution}}
Recommendation: {{recommendation}}
Final Score: {{final_score}} / Verdict: {{threshold_bucket}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}
Product Overview: {{product_overview}}
Benchmarking Takeaways: {{benchmarking_takeaways}}

Return a JSON object with exactly these keys:

"risk_register": Array of risk objects. Each object must have EXACTLY these keys:
  - "risk": string — short risk name (8 words max)
  - "severity": string — one of: "Critical" | "High" | "Medium" | "Low"
  - "likelihood": string — one of: "Very Likely" | "Likely" | "Possible" | "Unlikely"
  - "mitigation": string — 1–2 sentence mitigation strategy
  - "owner": string — the role responsible (e.g. "Founder", "Legal Counsel", "CTO", "Product")
Include at least 6 risks drawn from: regulatory exposure, competitive threats, ICP acquisition risk, technical risk, unit-economics risk, and founder/team risk.

"validation_test": Object with EXACTLY these keys:
  - "budget_max": string — maximum budget (e.g. "£4,000")
  - "duration_weeks": number — total experiment duration in weeks
  - "steps": Array of step objects, each with: { "week_range": string, "action": string, "success_metric": string, "kill_criterion": string }
  - "kill_criteria": string — overall rule for pausing/killing the experiment
  - "deliverable": string — what you have at the end if the experiment passes

"why_we_win": Array of competitive advantage objects. Each object must have EXACTLY these keys:
  - "advantage": string — the structural advantage (10 words max)
  - "why_hard_to_copy": string — 1–2 sentences explaining why this is defensible

Return ONLY valid JSON.',
  9
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      "group"     = EXCLUDED."group";
