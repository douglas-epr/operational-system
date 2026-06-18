-- Add Offer & Pricing fields to idea_market_opportunity
-- These support structured unit economics alongside TAM/SAM/SOM

ALTER TABLE public.idea_market_opportunity
  ADD COLUMN IF NOT EXISTS price_point     text,
  ADD COLUMN IF NOT EXISTS billing_model   text,
  ADD COLUMN IF NOT EXISTS cac_estimate    text,
  ADD COLUMN IF NOT EXISTS ltv_estimate    text;
