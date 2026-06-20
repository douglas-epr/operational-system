-- Add Build Brief columns to idea_report and insert the Build Brief prompt row.

ALTER TABLE idea_report
  ADD COLUMN IF NOT EXISTS brief_title text,
  ADD COLUMN IF NOT EXISTS brief_subtitle text,
  ADD COLUMN IF NOT EXISTS brief_html text,
  ADD COLUMN IF NOT EXISTS brief_generated_at timestamptz;

-- Insert the Build Brief Prompt row into the prompt table.
-- Fixed UUID so PROMPT_ID_BY_STEP.brief in actions.ts always resolves to this row.
INSERT INTO prompt (id, name, description, "group")
VALUES (
  'bf000001-0000-4000-8000-000000000001',
  'Build Brief Prompt',
  'You are a Move37 build strategist writing an investor-grade Build Brief for the idea described below. Your brief must match the style of the two Move37 reference briefs (Juno UK Tax Prep; Capital Allowances Claims): concise, direct, well-structured with clear h2/h3 headings and HTML tables where appropriate.

CRITICAL RULES:
- Use ONLY the SOURCE DATA supplied. Do not invent facts, company names, funding figures, or regulatory claims.
- Label every non-factual inference: [Fact] = drawn directly from source data. [Inference] = logical deduction. [Uncertain] = limited evidence. [Speculation] = hypothesis only.
- Empty source fields (e.g. no location supplied) are findings — document the gap explicitly rather than fabricating content.
- Output ONLY valid JSON — no markdown fences, no extra keys.

SOURCE DATA:
Idea: {{idea_name}}
Description: {{idea_description}}
Success Metrics: {{success_metrics}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Structure Metrics: {{structure_metrics}}

ICPs:
{{icps_block}}

Optimization Suggestions:
{{suggestions_block}}

Product Definition:
  Overview: {{product_overview}}
  Business Model: {{business_model}}
  Features: {{features}}
  Go-to-Market: {{go_to_market}}

Benchmarking:
  Overview: {{benchmarking_overview}}
  Competitive Comparison: {{benchmarking_comparison}}
  Business Models: {{benchmarking_models}}
  Takeaways: {{benchmarking_takeaways}}

Strategic Frameworks (per ICP):
{{strategic_block}}

Report Verdict:
  Score: {{final_score}} | Bucket: {{threshold_bucket}}
  Headline: {{report_headline}}
  Summary: {{report_summary}}
  Agreed Problem: {{agreed_problem}}
  Agreed Solution: {{agreed_solution}}
  Recommendation: {{recommendation}}
  Alignment Score: {{alignment_score}}

---

Return a JSON object with exactly these three keys:

"brief_title": A short, punchy project title (4–8 words). Example: "Juno: UK Tax Prep for Accountancy Firms"

"brief_subtitle": One sentence — the core value proposition. Example: "A workflow platform that automates capital allowance claim processing for UK accountancy practices."

"brief_html": A complete HTML document body (no <html>/<body> wrapper) containing ALL ten sections below. Use h2 for section headings, h3 for sub-headings, p for paragraphs, ul/ol for lists, and table/thead/tbody/tr/td/th for tables. Do NOT use markdown. Each section must reference the source data above — do not fabricate.

SECTION 1 — One-Liner & Thesis
  h2: "1. One-Liner & Thesis"
  - One-liner: a single sentence describing the product and its value
  - Thesis: 2–3 sentences explaining WHY this idea works, citing the agreed problem and agreed solution
  - Why-we-win: bullet list mapping the product''s structural advantages (from the ICP value maps and benchmarking takeaways)

SECTION 2 — What We Build
  h2: "2. What We Build"
  - Key components: what the product does (from Product Definition features)
  - Build order: which components come first and why (from go-to-market and feature priority signals)
  - Tech stack signals: any inferences from the product type (label [Inference])

SECTION 3 — Customer & List / Reach
  h2: "3. Customer & List / Reach"
  - Primary ICP: name, firmographics, day-in-life summary (from ICP block — top-scored ICP first)
  - Targeting approach: how to identify and reach this customer (from go-to-market and ICP firmographics)
  - Segment size: state explicitly if no market sizing data was provided — label [Uncertain]

SECTION 4 — Offer & Pricing + Unit Economics
  h2: "4. Offer & Pricing + Unit Economics"
  - Pricing model: specific price point if stated in Business Model; otherwise [Inference] from model name
  - Unit economics table: Revenue per unit | COGS estimate | Gross margin | CAC estimate | Payback period
    — Fill from source data where available; label each cell [Fact], [Inference], or [Uncertain]

SECTION 5 — Go-to-Market
  h2: "5. Go-to-Market"
  - Wedge: the first user archetype and acquisition strategy (from go-to-market field)
  - Channels: year-1 distribution channels ranked by priority
  - Content / outreach strategy

SECTION 6 — Regulatory / Legal / Compliance
  h2: "6. Regulatory / Legal / Compliance"
  - If no location or jurisdiction was supplied: state "No location/jurisdiction provided — regulatory research not possible. [Gap: add location input to complete this section.]"
  - If location is available: name the relevant regulatory body, key legislation, licensing requirements, data-privacy obligations

SECTION 7 — The Validation Test (£3–5k Experiment)
  h2: "7. The Validation Test"
  - Budget: propose a max budget (default £3,000–£5,000 unless cost data suggests otherwise)
  - Duration: weeks
  - Steps table: Week range | Action | Success metric | Kill criterion
  - Overall kill criteria: fail ≥2 gates → pause
  - Deliverable: what you have at the end if it passes

SECTION 8 — Tools & Stack
  h2: "8. Tools & Stack"
  - Infer from product type, feature list, and any explicit tech mentions
  - Label all as [Inference] unless stated in source data

SECTION 9 — Risks & What Kills It
  h2: "9. Risks & What Kills It"
  - Risk table: Risk | Severity (Critical/High/Medium/Low) | Likelihood | Mitigation
  - Include at least 5 rows drawn from: report penalties, benchmarking takeaways, regulatory gaps, ICP friction points
  - "What kills it" — one sentence per existential risk

SECTION 10 — Verdict
  h2: "10. Verdict"
  - Restate the report verdict (score, bucket, headline)
  - One-paragraph recommendation citing the agreed problem, agreed solution, and top 3 risks
  - Next action: the single most important thing to do in the next 30 days',
  9
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      "group" = EXCLUDED."group";
