-- Migration: Landing pages move from structured fields to a single raw-code column.
-- The public /m/[slug] page now renders `code_html` inside a sandboxed iframe
-- (full HTML/CSS/JS), generated in Claude Code or by the rewired "Build with AI".
-- Drops the now-unused structured columns. `capture_stages` stays so the existing
-- /api/m/[slug]/capture endpoint keeps recording waitlist signals.

ALTER TABLE public.mkt_landing ADD COLUMN IF NOT EXISTS code_html text;
ALTER TABLE public.mkt_landing DROP COLUMN IF EXISTS hero;
ALTER TABLE public.mkt_landing DROP COLUMN IF EXISTS sections;
ALTER TABLE public.mkt_landing DROP COLUMN IF EXISTS stripe_price_id;

NOTIFY pgrst, 'reload schema';
