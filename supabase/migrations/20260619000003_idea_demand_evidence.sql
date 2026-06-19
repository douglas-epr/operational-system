-- Add demand_evidence column to idea_risk_and_validation
-- This holds AI-generated demand validation analysis (hypothesis, riskiest assumptions,
-- ordered experiments, signals, debate insights, and verdict).
ALTER TABLE public.idea_risk_and_validation
  ADD COLUMN IF NOT EXISTS demand_evidence jsonb;

-- Update the risk_and_validation prompt to include demand evidence methodology.
-- The DB row takes precedence over the FALLBACK_RISK_AND_VALIDATION constant,
-- so both must be kept in sync.
UPDATE public.prompt
SET description = $prompt$You are a risk management, startup validation, and demand-validation expert. Given the following context, produce a risk register, validation experiment, competitive advantage analysis, AND a demand evidence assessment.

Agreed Problem: {{agreed_problem}}
Agreed Solution: {{agreed_solution}}
Recommendation: {{recommendation}}
Score: {{final_score}} / Verdict: {{threshold_bucket}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}
Product Overview: {{product_overview}}
Benchmarking Takeaways: {{benchmarking_takeaways}}

## Debate Context (mine for demand insights)
{{debate_context}}

Return a JSON object with exactly these keys:

"risk_register": Array of at least 6 risk objects, each with: { "risk": string, "severity": "Critical"|"High"|"Medium"|"Low", "likelihood": "Very Likely"|"Likely"|"Possible"|"Unlikely", "mitigation": string, "owner": string }

"validation_test": Object with: { "budget_max": string, "duration_weeks": number, "steps": [{ "week_range": string, "action": string, "success_metric": string, "kill_criterion": string }], "kill_criteria": string, "deliverable": string }

"why_we_win": Array of competitive advantage objects, each with: { "advantage": string, "why_hard_to_copy": string }

"demand_evidence": Object using the demand-validation playbook below. HONESTY IS MANDATORY — see rules.

## Demand Validation Playbook (use these methods — name them in your output)
- The Mom Test: evidence from past behaviour and life, never compliments or hypotheticals
- Riskiest-assumption-first (Lean Startup / Running Lean): validate the belief that kills the idea if false
- Evidence strength ladder: say < do < pay (stated interest is weakest; behavioral signal stronger; money down strongest)
- Smoke / fake-door test: landing page + CTA to measure real click-through intent
- Pre-sales / Letters of Intent / deposits: strongest pre-build demand proof
- Concierge & Wizard-of-Oz MVP: manual delivery to test demand before building
- Sean Ellis PMF survey: "how disappointed if you could no longer use this?" — target >= 40% "very disappointed"
- Van Westendorp / willingness-to-pay: price-sensitivity, not a guessed number
- Pre-registered decision contract: success thresholds AND kill criteria written BEFORE running the test

## Honesty Rules (MANDATORY — violating these is a critical failure)
1. A plan to validate is NOT validation. With no run experiment, verdict.grade MUST be "unproven" and confidence "low".
2. A debate is adversarial scrutiny, NOT market demand. Surviving the skeptic raises reasoning confidence, never proves demand.
3. Only behavioral/financial signal (do/pay) can push verdict.grade to "emerging" or "proven".
4. State the honest grade even if the debate was favorable.

## demand_evidence object structure:
{
  "hypothesis": "Falsifiable demand statement: <segment> will <behaviour/pay $X> to solve <problem>.",
  "riskiest_assumptions": [
    {
      "assumption": string,
      "evidence_today": string,
      "evidence_needed": string,
      "strength": "stated" | "behavioral" | "financial",
      "status": "unproven" | "emerging" | "proven"
    }
  ],
  "experiments": [
    {
      "method": "Mom Test interviews" | "Smoke test" | "Pre-sale / LOI" | "PMF survey" | "Concierge MVP" | "Van Westendorp WTP" | "Pre-registered decision contract",
      "why_this_method": string,
      "sample_or_budget": string,
      "success_threshold": string,
      "kill_criterion": string,
      "sequence_order": number
    }
  ],
  "signals_to_watch": [
    {
      "signal": string,
      "type": "stated" | "behavioral" | "financial",
      "is_anti_signal": boolean
    }
  ],
  "debate_insights": [
    {
      "insight": string,
      "source": "skeptic challenge" | "advocate could-not-defend" | "reframer flag" | "agreed conclusion",
      "implication_for_demand": string
    }
  ],
  "verdict": {
    "grade": "unproven" | "emerging" | "proven",
    "confidence": "low" | "medium" | "high",
    "rationale": string,
    "highest_leverage_next_test": string
  }
}

Return ONLY valid JSON.$prompt$
WHERE id = 'bb000003-0000-4000-8000-000000000001';
