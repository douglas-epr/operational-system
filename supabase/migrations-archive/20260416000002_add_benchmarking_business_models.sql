-- Add possible_business_models column to idea_benchmarking
-- Stores AI-generated or manually entered HTML text describing viable business
-- models for the idea (SaaS, marketplace, freemium, etc.).
ALTER TABLE idea_benchmarking ADD COLUMN IF NOT EXISTS possible_business_models text;
