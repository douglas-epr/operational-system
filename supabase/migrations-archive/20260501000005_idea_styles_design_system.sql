-- ================================================================
-- Migration: 20260501000005_idea_styles_design_system.sql
--
-- Expands idea_styles from 3 rich-text blobs into a full design
-- system by adding structured JSONB token columns and additional
-- rich-text narrative sections.
--
-- Existing columns are kept for backward compatibility:
--   logo_branding   TEXT  — logo / brand identity (rich HTML)
--   color_palette   TEXT  — color narrative (rich HTML)
--   product_feeling TEXT  — visual mood / feeling (rich HTML)
--
-- New columns:
--   Flat color shortcuts:
--     primary_color, secondary_color, accent_color, neutral_color
--
--   Structured token columns (JSONB):
--     color_tokens    — [{name, hex, role, shades: [{hex, label}]}]
--     typography      — {heading_font, body_font, mono_font,
--                        scale: [{name, size_px, weight, line_height}]}
--     spacing         — {unit_px, scale: [4,8,12,16,24,32,48,64,80,96]}
--     border_radius   — {sm, md, lg, xl, full}
--     shadows         — [{name, css_value, usage}]
--
--   Rich-text narrative sections (HTML):
--     brand_voice        — personality, tone of voice
--     iconography_style  — icon library + style guidelines
--     motion_principles  — animation / transition approach
-- ================================================================

ALTER TABLE public.idea_styles
  -- Quick-access color tokens (hex strings, e.g. "#3B82F6")
  ADD COLUMN IF NOT EXISTS primary_color    TEXT,
  ADD COLUMN IF NOT EXISTS secondary_color  TEXT,
  ADD COLUMN IF NOT EXISTS accent_color     TEXT,
  ADD COLUMN IF NOT EXISTS neutral_color    TEXT,

  -- Structured design-token JSONB blobs
  ADD COLUMN IF NOT EXISTS color_tokens     JSONB,
  ADD COLUMN IF NOT EXISTS typography       JSONB,
  ADD COLUMN IF NOT EXISTS spacing          JSONB,
  ADD COLUMN IF NOT EXISTS border_radius    JSONB,
  ADD COLUMN IF NOT EXISTS shadows          JSONB,

  -- Rich-text narrative sections
  ADD COLUMN IF NOT EXISTS brand_voice         TEXT,
  ADD COLUMN IF NOT EXISTS iconography_style   TEXT,
  ADD COLUMN IF NOT EXISTS motion_principles   TEXT;

NOTIFY pgrst, 'reload schema';
