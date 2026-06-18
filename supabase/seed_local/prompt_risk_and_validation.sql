INSERT INTO prompt (id, name, description, "group")
VALUES (
  'bb000003-0000-4000-8000-000000000001',
  'Risk Register & Validation Test Prompt',
  $prompt$You are a risk management expert and startup validation specialist. Given the following startup idea and its evaluation context, produce a structured risk register, a lean validation experiment, and a competitive advantage analysis.

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

Return ONLY valid JSON.$prompt$,
  9
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      "group"     = EXCLUDED."group"
