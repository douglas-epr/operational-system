-- Migration: Drop idea_user_type table
-- Date: 2026-04-15
-- Purpose: The "User Flow" section in Product Definition & Flows has been
-- removed from the UI; this table is no longer referenced anywhere.

DROP TABLE IF EXISTS public.idea_user_type;
