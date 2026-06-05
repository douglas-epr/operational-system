-- Add social_discovery to the mkt_channel enum for the Social Discovery Pipeline.
-- This enables multi-stage async Apify orchestration (LinkedIn + Instagram + Facebook +
-- YouTube + Twitter/X + TikTok) stored as a state machine in mkt_source_run.query JSONB.
ALTER TYPE mkt_channel ADD VALUE IF NOT EXISTS 'social_discovery';
