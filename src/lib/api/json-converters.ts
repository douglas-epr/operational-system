/**
 * JSON Converters — Internal replacement for Bubble "convert_json_text_into_json_object" calls
 * Source: docs/reference_docs/api-connectors.md — Bubble connector section
 *
 * Context: In Bubble, the app called its own backend workflow endpoint
 * (blurapps.com/api/1.1/wf/convert_json_text_into_json_object) to parse
 * AI-generated JSON text strings into typed objects. In this Next.js app,
 * that parsing is done locally with full type safety.
 *
 * Each function accepts a raw JSON string (from an AI response) and returns
 * the typed object or throws a descriptive error.
 */

// ── Shared error type ─────────────────────────────────────────────────────────

export interface ConvertResult<T> {
  data?: T;
  returned_an_error: boolean;
  error?: { status_code: number; status_message: string; body: string };
}

function parseJson<T>(input_json: string): ConvertResult<T> {
  try {
    const data = JSON.parse(input_json) as T;
    return { returned_an_error: false, data };
  } catch (e) {
    return {
      returned_an_error: true,
      error: {
        status_code: 422,
        status_message: "Invalid JSON",
        body: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

// ── 1. Structure & Align JSON ─────────────────────────────────────────────────
// Source: "Convert Structure & Align JSON Text" call
// Used after AI generates a structured analysis of an idea/product.

export interface StructureAlignOutput {
  "The Core Problem": string;
  "Target Audience": string;
  "Primary Success Metrics": string;
}

export function convertStructureAlignJson(
  input_json: string
): ConvertResult<StructureAlignOutput> {
  return parseJson<StructureAlignOutput>(input_json);
}

// ── 2. ICP (Ideal Customer Profile) ──────────────────────────────────────────
// Source: "Convert Refining ICP JSON Text" and "Convert Refining ICP Update JSON Text"

export interface ICP {
  id?: string;
  name: string;
  description?: string;
  operational_environment: string;
  strategic_pain_points_and_acute_needs: string;
  how_problems_are_solved_currently?: string;
  how_problems_could_be_solved?: string;
}

export interface ICPsOutput {
  ICPs: ICP[];
}

export function convertRefiningIcpJson(
  input_json: string
): ConvertResult<ICPsOutput> {
  return parseJson<ICPsOutput>(input_json);
}

// ── 3. Strategic Frameworks ICP (full) ───────────────────────────────────────
// Source: "Convert Strategic Frameworks JSON Text"
// Extended ICP shape used in the strategic frameworks section.

export interface StrategicICP extends ICP {
  value_proposition_icp_pains?: string;
  value_proposition_icp_gains?: string;
  value_proposition_value_map_solutions?: string;
  value_proposition_value_map_gain_creators?: string;
  jtbd?: string;
  architect_profile_picture?: string;
  architect_title?: string;
  architect_subtitle?: string;
  architect_tags?: string[];
  architect_psychographics?: string;
  architect_firmographics?: string;
  pitch_need?: string;
  pitch_approach?: string;
  pitch_benefit?: string;
  pitch_competition?: string;
}

export interface StrategicFrameworksOutput {
  ICPs: StrategicICP[];
}

/** Single-ICP flat output shape — used by the per-ICP sequential generation loop. */
export type SingleIcpFrameworkOutput = StrategicICP & {
  optimization_suggestions?: { name: string; description: string }[];
};

export function convertStrategicFrameworksJson(
  input_json: string
): ConvertResult<StrategicFrameworksOutput> {
  return parseJson<StrategicFrameworksOutput>(input_json);
}

// ── 4. Product Definition & Flows ────────────────────────────────────────────
// Source: "Convert Product Definition & Flows JSON Text" and update variants

export interface UserFlow {
  id?: string;
  user_name: string;
  description: string;
  user_flow: string;
}

export interface ProductDefinitionOutput {
  "Product Overview": string;
  "Business Model": string;
  "Feature List & Logic": string;
  "Go-to-Market": string;
  "User Flows": UserFlow[];
}

export function convertProductDefinitionJson(
  input_json: string
): ConvertResult<ProductDefinitionOutput> {
  return parseJson<ProductDefinitionOutput>(input_json);
}

// ── 5. Benchmarking ─────────────────────────────────────────────────────────
// AI-generated competitive analysis with overview, comparison table, and takeaways.

export interface BenchmarkingOutput {
  overview: string;
  comparison: string;
  possible_business_models?: string;
  takeaways: string;
}

// ── 6. PRD (Product Requirements Document) ──────────────────────────────────
// AI-generated PRD with 9 sections.

export interface PrdOutput {
  app_overview: string;
  objectives: string;
  priority_personas: string;
  essential_features: string;
  user_flow: string;
  features_per_page: string;
  non_functional_reqs: string;
  out_of_scope: string;
  success_indicators: string;
  phasing_notes: string;
}

// ── 7. Database ─────────────────────────────────────────────────────────────
// AI-generated data model with tables, relationships, and notes.

export interface DatabaseOutput {
  tables_schema: string;
  relationships: string;
  notes: string;
}

// ── 8. Visual Styles ────────────────────────────────────────────────────────
// AI-generated branding + full design system.

export interface VisualStylesColorToken {
  name: string;
  hex: string;
  role: string;
  shades?: { hex: string; label: string }[];
}

export interface VisualStylesTypography {
  heading_font: string;
  body_font: string;
  mono_font?: string;
  scale: { name: string; size_px: number; weight: number; line_height: number }[];
}

export interface VisualStylesSpacing {
  unit_px: number;
  scale: number[];
}

export interface VisualStylesBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface VisualStylesShadow {
  name: string;
  css_value: string;
  usage: string;
}

export interface VisualStylesOutput {
  // Legacy rich-text (kept for backward compat)
  logo_branding: string;
  color_palette: string;
  color_narrative?: string; // renamed key in prompt; mapped to color_palette on save
  product_feeling: string;
  // Quick-access colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  neutral_color: string;
  // Structured tokens
  color_tokens: VisualStylesColorToken[];
  typography: VisualStylesTypography;
  spacing: VisualStylesSpacing;
  border_radius: VisualStylesBorderRadius;
  shadows: VisualStylesShadow[];
  // Narrative sections (HTML)
  brand_voice: string;
  iconography_style: string;
  motion_principles: string;
}

// ── 9. Milestones & Tasks ───────────────────────────────────────────────────
// AI-generated project milestones with tasks and time estimates.

export interface MilestonesAndTasksOutput {
  content: string;
}

// ── 9b. Report (readiness dashboard + playbook) ──────────────────────────────
// AI-generated weighted score, automatic penalties, and long-form playbook.

export interface ReportAreaOutput {
  key: string;
  label: string;
  weight_pct: number;
  raw_score_pct: number;
  weighted_points: number;
  status: "strong" | "average" | "weak";
  description: string;
}

export interface ReportPenaltyOutput {
  label: string;
  points: number;
}

export interface ReportOutput {
  area_scores: ReportAreaOutput[];
  penalties: ReportPenaltyOutput[];
  final_score: number;
  threshold_bucket: "build" | "refine" | "kill";
  headline: string;
  summary: string;
  next_steps: string;
  playbook_title: string;
  playbook_subtitle: string;
  playbook_html: string;
}

// Talent & Client verification (Bubble GET calls) were removed alongside the
// talent/client tables in the 2026-06-14 cleanup; no replacement is needed.
