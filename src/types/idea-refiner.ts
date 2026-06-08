/**
 * Types, enums, and labels for the Sandbox Planner feature.
 * Source: supabase/migrations/20260304000000_initial_schema.sql (lines 241-264, 858-956)
 * Maps to Bubble data types: idea, idea_icp, idea_optimization_suggestion,
 * idea_product_definition_and_flows, idea_structure_and_align
 */

// ── Enums ────────────────────────────────────────────────────────────────────

/** Maps to PostgreSQL enum os_idea_block */
export type IdeaBlock =
  | "ideas"
  | "structure_align"
  | "refining_icp"
  | "product_definition_flows"
  | "strategic_frameworks"
  | "benchmarking"
  | "prd"
  | "database"
  | "visual_styles"
  | "milestones_and_tasks"
  | "report";

/** Maps to PostgreSQL enum os_idea_field */
export type IdeaField =
  | "product_overview"
  | "essential_features"
  | "user_flows"
  | "value_proposition"
  | "jtbd_synthesis"
  | "icp_architect"
  | "nabc_pitch"
  | "structure_align"
  | "humanizing_target_audience"
  | "primary_success_metric"
  | "day_in_life"
  | "pain_points_acute_needs";

// ── Labels ───────────────────────────────────────────────────────────────────

/** Human-readable labels for each idea block tab. */
export const IDEA_BLOCK_LABELS: Record<IdeaBlock, string> = {
  ideas: "Ideas",
  structure_align: "Structure & Align",
  refining_icp: "Refining ICP",
  product_definition_flows: "Product Definition & Flows",
  strategic_frameworks: "Strategic Frameworks",
  benchmarking: "Benchmarking",
  prd: "PRD",
  database: "Database",
  visual_styles: "Visual Styles",
  milestones_and_tasks: "Project Milestones & Tasks",
  report: "Report",
};

/** Step number and subtitle for each block in the wizard flow. */
export const IDEA_BLOCK_STEPS: Record<IdeaBlock, { step: number; subtitle: string }> = {
  ideas: {
    step: 1,
    subtitle: "Select an existing idea or create a new one.",
  },
  structure_align: {
    step: 2,
    subtitle: "AI has extracted key components from your idea. Review and refine them below.",
  },
  refining_icp: {
    step: 3,
    subtitle: "Deep ICP Profiling.",
  },
  product_definition_flows: {
    step: 4,
    subtitle: "Define your product's core features and map out user journeys.",
  },
  benchmarking: {
    step: 5,
    subtitle: "Competitive analysis and benchmarking.",
  },
  strategic_frameworks: {
    step: 6,
    subtitle: "Your Strategic Frameworks. Review the synthesis below.",
  },
  prd: {
    step: 7,
    subtitle: "Product Requirements Document.",
  },
  database: {
    step: 8,
    subtitle: "Data model and schema design.",
  },
  visual_styles: {
    step: 9,
    subtitle: "Visual identity and branding.",
  },
  milestones_and_tasks: {
    step: 10,
    subtitle: "Project milestones, tasks, and time estimates.",
  },
  report: {
    step: 11,
    subtitle: "Final readiness score and downloadable playbook.",
  },
};

/** Ordered list of idea blocks for tab rendering. */
export const IDEA_BLOCKS_ORDERED: IdeaBlock[] = [
  "ideas",
  "structure_align",
  "refining_icp",
  "product_definition_flows",
  "benchmarking",
  "strategic_frameworks",
  "prd",
  "database",
  "visual_styles",
  "milestones_and_tasks",
  "report",
];

// ── Database Row Interfaces ──────────────────────────────────────────────────

/** Represents a row in the `idea` table. */
export interface Idea {
  id: string;
  project_id: string | null;
  created_by: string | null;
  name: string;
  score: number | null;
  description: string | null;
  success_metrics: string | null;
  current_block_ended: IdeaBlock | null;
  current_blocks_updating: string | null;
  created_at: string;
  /** Joined from project table when fetching ideas list */
  project?: { id: string; name: string | null } | null;
  /** Derived in the page handler from the joined creator profile */
  creator_name?: string | null;
}

/** Represents a row in the `idea_icp` table (Ideal Customer Profile). */
export interface IdeaIcp {
  id: string;
  idea_id: string | null;
  name: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  day_in_life: string | null;
  score: number | null;
  picture: string | null;
  tags: string[];
  jtbd: string | null;
  pitch_need: string | null;
  pain_points: string | null;
  firmographics: string | null;
  pitch_benefit: string | null;
  pitch_approach: string | null;
  psychographics: string | null;
  pitch_competition: string | null;
  value_proposition_icp_pains: string | null;
  value_proposition_value_map_solutions: string | null;
  value_proposition_icp_gains: string | null;
  value_proposition_value_map_gain_creators: string | null;
  how_problems_are_solved: string | null;
  how_problems_could_be_solved: string | null;
  our_solution_value: string | null;
  score_rationale: string | null;
  created_at: string;
}

/** Represents a row in the `idea_optimization_suggestion` table. */
export interface IdeaOptimizationSuggestion {
  id: string;
  idea_id: string | null;
  icp_id: string | null;
  name: string | null;
  description: string | null;
  created_at: string;
}

/** Represents a row in the `idea_product_definition_and_flows` table. */
export interface IdeaBlockProductDefinition {
  id: string;
  idea_id: string | null;
  created_by: string | null;
  summary: string | null;
  features: string | null;
  created_at: string;
}

/** Represents a row in the `idea_structure_and_align` table. */
export interface IdeaBlockStructureAlign {
  id: string;
  idea_id: string | null;
  success_metrics_text: string | null;
  product_overview_text: string | null;
  essential_features_text: string | null;
  success_metrics: string | null;
  target_audience: string | null;
  core_problem: string | null;
  created_at: string;
}

/** Represents a row in the `idea_benchmarking` table. */
export interface IdeaBenchmarking {
  id: string;
  idea_id: string;
  overview: string | null;
  comparison: string | null;
  possible_business_models: string | null;
  takeaways: string | null;
  created_at: string;
}

/** Represents a row in the `idea_prd` table. */
export interface IdeaPrd {
  id: string;
  idea_id: string;
  app_overview: string | null;
  objectives: string | null;
  priority_personas: string | null;
  essential_features: string | null;
  user_flow: string | null;
  non_functional_reqs: string | null;
  out_of_scope: string | null;
  success_indicators: string | null;
  phasing_notes: string | null;
  created_at: string;
}

/** Represents a row in the `idea_database` table. */
export interface IdeaDatabase {
  id: string;
  idea_id: string;
  tables_schema: string | null;
  relationships: string | null;
  notes: string | null;
  created_at: string;
}

// ── Design System Token Types ────────────────────────────────────────────────

export interface ColorToken {
  name: string;
  hex: string;
  role: string;
  shades?: { hex: string; label: string }[];
}

export interface TypographySystem {
  heading_font: string;
  body_font: string;
  mono_font?: string;
  scale: { name: string; size_px: number; weight: number; line_height: number }[];
}

export interface SpacingSystem {
  unit_px: number;
  scale: number[];
}

export interface BorderRadiusSystem {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowToken {
  name: string;
  css_value: string;
  usage: string;
}

/** Represents a row in the `idea_styles` table. */
export interface IdeaStyles {
  id: string;
  idea_id: string;
  // Legacy rich-text fields (kept for backward compatibility)
  logo_branding: string | null;
  color_palette: string | null;
  product_feeling: string | null;
  // Quick-access flat color tokens (hex strings, e.g. "#3B82F6")
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  neutral_color: string | null;
  // Structured design-token JSONB blobs
  color_tokens: ColorToken[] | null;
  typography: TypographySystem | null;
  spacing: SpacingSystem | null;
  border_radius: BorderRadiusSystem | null;
  shadows: ShadowToken[] | null;
  // Rich-text narrative sections (HTML)
  brand_voice: string | null;
  iconography_style: string | null;
  motion_principles: string | null;
  created_at: string;
}

/** Represents a row in the `idea_milestones_and_tasks` table. */
export interface IdeaMilestonesAndTasks {
  id: string;
  idea_id: string;
  content: string | null;
  created_at: string;
}

// ── Report ───────────────────────────────────────────────────────────────────

/** One of the 6 weighted scoring areas in the Report step. */
export interface IdeaReportArea {
  key: string;
  label: string;
  weight_pct: number;
  raw_score_pct: number;
  weighted_points: number;
  status: "strong" | "average" | "weak";
  description: string;
}

/** A single automatic penalty deduction applied by the Report step. */
export interface IdeaReportPenalty {
  label: string;
  points: number;
}

/** Represents a row in the `idea_report` table. */
export interface IdeaReport {
  id: string;
  idea_id: string;
  final_score: number | null;
  threshold_bucket: "ready" | "refine" | "risk" | null;
  headline: string | null;
  summary: string | null;
  area_scores: IdeaReportArea[];
  penalties: IdeaReportPenalty[];
  next_steps: string | null;
  playbook_title: string | null;
  playbook_subtitle: string | null;
  playbook_html: string | null;
  created_at: string;
}

// ── Composite Types ──────────────────────────────────────────────────────────

/** Full idea data with all related entities loaded. Used when viewing an idea's refinement steps. */
export interface IdeaFull {
  idea: Idea;
  structureAlign: IdeaBlockStructureAlign | null;
  icps: IdeaIcp[];
  productDefinition: IdeaBlockProductDefinition | null;
  optimizationSuggestions: IdeaOptimizationSuggestion[];
  benchmarking: IdeaBenchmarking | null;
  prd: IdeaPrd | null;
  database: IdeaDatabase | null;
  styles: IdeaStyles | null;
  milestonesAndTasks: IdeaMilestonesAndTasks | null;
  report: IdeaReport | null;
}

// ── Helper Types ─────────────────────────────────────────────────────────────

/** Minimal project shape for the project dropdown in Create Idea modal. */
export interface ProjectOption {
  id: string;
  name: string | null;
}

// ── Chatbot ──────────────────────────────────────────────────────────────────

/** Maps to PostgreSQL enum os_idea_chatbot_message_type. */
export type IdeaChatbotRole = "user" | "chatbot";

/** Represents a row in the `idea_chatbot` table. */
export interface IdeaChatbotMessage {
  id: string;
  idea_id: string;
  created_by: string | null;
  type: IdeaChatbotRole;
  message: string;
  created_at: string;
  updated_at: string;
}
