INSERT INTO prompt (id, name, description, "group")
VALUES (
  'bb000002-0000-4000-8000-000000000001',
  'Market Opportunity & Sizing Prompt',
  $prompt$You are a market sizing expert and business analyst. Given the following startup idea and its context, produce a rigorous market opportunity analysis using TAM/SAM/SOM methodology.

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

"price_point": Rich HTML — proposed price point(s) for the product. If not determinable from source data, label [Inference] and explain reasoning from the business model and ICP willingness to pay.

"billing_model": Rich HTML — how the product is monetised (e.g. monthly SaaS, one-time, usage-based, freemium). Derive from business model field; label [Fact] if stated, [Inference] if derived.

"cac_estimate": Rich HTML — Customer Acquisition Cost estimate. Use a table: Channel | Estimated CAC | Confidence. Label each row [Fact], [Inference], or [Uncertain].

"ltv_estimate": Rich HTML — Customer Lifetime Value estimate. Show: ARPU | Avg Churn / Contract Length | LTV formula | Result. Label cells [Fact], [Inference], or [Uncertain].

All values must be valid HTML strings. Return ONLY valid JSON.$prompt$,
  9
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      "group"     = EXCLUDED."group"
