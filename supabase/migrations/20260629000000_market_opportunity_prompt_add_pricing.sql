-- Add Offer & Pricing fields to the Market Opportunity AI prompt.
-- Migration 20260623000000 added price_point, billing_model, cac_estimate, and
-- ltv_estimate columns to idea_market_opportunity, but the DB-stored prompt
-- (bb000002-0000-4000-8000-000000000001) was not updated, so the AI never
-- returned values for those fields. This migration appends the four new output
-- keys to the prompt before the final "Return ONLY valid JSON." sentinel.

UPDATE public.prompt
SET description = replace(
  description,
  'All values must be valid HTML strings. Return ONLY valid JSON.',
  $pricing$"price_point": Rich HTML — Proposed price point(s) for this product. Include all pricing tiers if applicable (e.g. "$29/mo starter, $99/mo pro"). Ground estimates in ICP firmographics and benchmarking context. Label [Fact], [Inference], or [Uncertain].

"billing_model": Rich HTML — How the product is monetised. Name the model (e.g. SaaS subscription, transaction fee, freemium + upsell, per-seat, usage-based). Include any revenue share or commission structure if relevant.

"cac_estimate": Rich HTML — Customer Acquisition Cost estimate with methodology. Show the assumed channels, cost per channel, and blended CAC. Label all assumptions.

"ltv_estimate": Rich HTML — Customer Lifetime Value estimate. Show the calculation: ARPU × average retention months. Include the LTV:CAC ratio. Label all assumptions.

All values must be valid HTML strings. Return ONLY valid JSON.$pricing$
)
WHERE id = 'bb000002-0000-4000-8000-000000000001'
  AND description NOT LIKE '%price_point%';
