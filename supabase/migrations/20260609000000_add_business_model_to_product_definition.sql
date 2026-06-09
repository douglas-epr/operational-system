-- Migration: Add business_model column to idea_product_definition_and_flows.
-- Allows the Product Definition step (Step 4) to store the chosen business model
-- alongside the product summary and feature list.

ALTER TABLE public.idea_product_definition_and_flows
  ADD COLUMN IF NOT EXISTS business_model TEXT;
