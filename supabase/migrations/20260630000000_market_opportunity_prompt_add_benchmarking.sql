-- Feed competitive benchmarking into the Market Opportunity AI prompt.
-- The Ideas Refiner flow now runs Benchmarking (step 6) BEFORE Market Opportunity
-- (step 7), so the benchmarking comparison of similar apps (incl. their pricing) is
-- available to ground the market sizing and unit economics. This migration inserts
-- the four benchmarking inputs into the DB-stored prompt
-- (bb000002-0000-4000-8000-000000000001) and instructs the model to anchor pricing
-- to the real comparables. The code-side renderPrompt() now supplies these vars.
-- Idempotent: only runs if the prompt has not already been updated.

UPDATE public.prompt
SET description = replace(
  description,
  $anchor$Business Model: {{business_model}}

Return a JSON object with exactly these keys:$anchor$,
  $repl$Business Model: {{business_model}}

COMPETITIVE BENCHMARKING (from the previous step — use as primary evidence for pricing and sizing):
Overview: {{benchmarking_overview}}
Comparison of Similar Apps: {{benchmarking_comparison}}
Possible Business Models: {{benchmarking_models}}
Key Takeaways: {{benchmarking_takeaways}}

When the benchmarking data names competitors and their pricing, anchor your price_point, billing_model, cac_estimate, and ltv_estimate to those real comparables and explicitly reference them. Do not fabricate figures.

Return a JSON object with exactly these keys:$repl$
)
WHERE id = 'bb000002-0000-4000-8000-000000000001'
  AND description NOT LIKE '%benchmarking_overview%';
