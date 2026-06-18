/**
 * Types, enums, and labels for the Sandbox Planner feature.
 * Source: supabase/migrations/20260304000000_initial_schema.sql (lines 241-264, 858-956)
 * Maps to Bubble data types: idea, idea_icp, idea_optimization_suggestion,
 * idea_product_definition_and_flows, idea_structure_and_align
 */
import type { PlaybookVersion } from "./docs";

// ── Enums ────────────────────────────────────────────────────────────────────

/** Maps to PostgreSQL enum os_idea_block */
export type IdeaBlock =
  | "ideas"
  | "structure_align"
  | "refining_icp"
  | "product_definition_flows"
  | "location_legislation"
  | "market_opportunity"
  | "strategic_frameworks"
  | "benchmarking"
  | "prd"
  | "database"
  | "visual_styles"
  | "milestones_and_tasks"
  | "report"
  | "risk_and_validation"
  | "playbook";

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
  location_legislation: "Location & Legislation",
  market_opportunity: "Market Opportunity",
  strategic_frameworks: "Strategic Frameworks",
  benchmarking: "Benchmarking",
  prd: "PRD",
  database: "Database",
  visual_styles: "Visual Styles",
  milestones_and_tasks: "Project Milestones & Tasks",
  report: "Report",
  risk_and_validation: "Risk & Validation",
  playbook: "Playbook",
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
  location_legislation: {
    step: 5,
    subtitle: "Regulatory bodies, key legislation, and compliance requirements for your target market.",
  },
  market_opportunity: {
    step: 6,
    subtitle: "TAM/SAM/SOM sizing, data sources, and market growth drivers.",
  },
  benchmarking: {
    step: 7,
    subtitle: "Competitive analysis and benchmarking.",
  },
  strategic_frameworks: {
    step: 8,
    subtitle: "Your Strategic Frameworks. Review the synthesis below.",
  },
  risk_and_validation: {
    step: 9,
    subtitle: "Risk register, lean validation experiment, and competitive advantage analysis.",
  },
  report: {
    step: 10,
    subtitle: "Go/no-go verdict before committing to the build.",
  },
  prd: {
    step: 11,
    subtitle: "Product Requirements Document.",
  },
  database: {
    step: 12,
    subtitle: "Data model and schema design.",
  },
  visual_styles: {
    step: 13,
    subtitle: "Visual identity and branding.",
  },
  milestones_and_tasks: {
    step: 14,
    subtitle: "Project milestones, tasks, and time estimates.",
  },
  playbook: {
    step: 15,
    subtitle: "Project playbook / build guide.",
  },
};

/** Ordered list of idea blocks for tab rendering. */
export const IDEA_BLOCKS_ORDERED: IdeaBlock[] = [
  "ideas",
  "structure_align",
  "refining_icp",
  "product_definition_flows",
  "location_legislation",
  "market_opportunity",
  "benchmarking",
  "strategic_frameworks",
  "risk_and_validation",
  "report",
  "prd",
  "database",
  "visual_styles",
  "milestones_and_tasks",
  "playbook",
];

// ── Database Row Interfaces ──────────────────────────────────────────────────

/** Represents a row in the `idea` table. */
export interface Idea {
  id: string;
  project_id: string | null;
  created_by: string | null;
  name: string;
  version_name: string | null;
  authorized_users: string[];
  score: number | null;
  description: string | null;
  success_metrics: string | null;
  location: string | null;
  jurisdiction: string | null;
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
  business_model: string | null;
  features: string | null;
  go_to_market: string | null;
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

/** Represents a row in the `idea_location_legislation` table. */
export interface IdeaLocationLegislation {
  id: string;
  idea_id: string;
  regulatory_bodies: string | null;
  key_legislation: string | null;
  licensing_requirements: string | null;
  data_privacy_rules: string | null;
  compliance_timeline: string | null;
  regulatory_moat: string | null;
  red_flags: string | null;
  created_at: string;
}

/** Represents a row in the `idea_market_opportunity` table. */
export interface IdeaMarketOpportunity {
  id: string;
  idea_id: string;
  tam_description: string | null;
  tam_estimate: string | null;
  sam_description: string | null;
  sam_estimate: string | null;
  som_description: string | null;
  som_estimate: string | null;
  data_sources: string | null;
  segment_filter_logic: string | null;
  growth_drivers: string | null;
  market_risks: string | null;
  price_point: string | null;
  billing_model: string | null;
  cac_estimate: string | null;
  ltv_estimate: string | null;
  created_at: string;
}

/** Risk item in the risk_register JSONB array. */
export interface RiskItem {
  risk: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  likelihood: "Very Likely" | "Likely" | "Possible" | "Unlikely";
  mitigation: string;
  owner: string;
}

/** Validation test step in the validation_test JSONB object. */
export interface ValidationTestStep {
  week_range: string;
  action: string;
  success_metric: string;
  kill_criterion: string;
}

/** Competitive advantage item in the why_we_win JSONB array. */
export interface WhyWeWinItem {
  advantage: string;
  why_hard_to_copy: string;
}

/** Represents a row in the `idea_risk_and_validation` table. */
export interface IdeaRiskAndValidation {
  id: string;
  idea_id: string;
  risk_register: RiskItem[] | null;
  validation_test: {
    budget_max: string;
    duration_weeks: number;
    steps: ValidationTestStep[];
    kill_criteria: string;
    deliverable: string;
  } | null;
  why_we_win: WhyWeWinItem[] | null;
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

/** Alignment block produced by the Devil's Advocate debate scorer. */
export interface IdeaReportAlignment {
  problem_fit_pct: number;
  solution_fit_pct: number;
  reframe_distance: "minor" | "moderate" | "major";
  alignment_score: number;
  problem_rationale: string;
  solution_rationale: string;
  verdict: string;
}

/** A single turn in the Devil's Advocate debate transcript. */
export interface IdeaReportDebateTurn {
  gate: "problem" | "solution";
  round: number;
  role: "skeptic" | "advocate";
  content: string;
  proposed_statement: string;
  agree: boolean;
}

/** Represents a row in the `idea_report` table. */
export interface IdeaReport {
  id: string;
  idea_id: string;
  final_score: number | null;
  threshold_bucket: "build" | "refine" | "kill" | null;
  headline: string | null;
  summary: string | null;
  area_scores: IdeaReportArea[];
  penalties: IdeaReportPenalty[];
  next_steps: string | null;
  playbook_title: string | null;
  playbook_subtitle: string | null;
  playbook_html: string | null;
  created_at: string;
  // Devil's Advocate debate fields (added 2026-06-11)
  agreed_problem: string | null;
  agreed_solution: string | null;
  recommendation: string | null;
  revised_description: string | null;
  completeness_score: number | null;
  alignment: IdeaReportAlignment | null;
  debate_transcript: IdeaReportDebateTurn[];
  debate_meta: {
    problem_rounds: number;
    solution_rounds: number;
    problem_converged: boolean;
    solution_converged: boolean;
    impasse_note?: string;
  } | null;
  // Build Brief fields (added 2026-06-17)
  brief_title: string | null;
  brief_subtitle: string | null;
  brief_html: string | null;
  brief_generated_at: string | null;
}

// ── Composite Types ──────────────────────────────────────────────────────────

/** Full idea data with all related entities loaded. Used when viewing an idea's refinement steps. */
export interface IdeaFull {
  idea: Idea;
  structureAlign: IdeaBlockStructureAlign | null;
  icps: IdeaIcp[];
  productDefinition: IdeaBlockProductDefinition | null;
  optimizationSuggestions: IdeaOptimizationSuggestion[];
  locationLegislation: IdeaLocationLegislation | null;
  marketOpportunity: IdeaMarketOpportunity | null;
  benchmarking: IdeaBenchmarking | null;
  riskAndValidation: IdeaRiskAndValidation | null;
  prd: IdeaPrd | null;
  database: IdeaDatabase | null;
  styles: IdeaStyles | null;
  milestonesAndTasks: IdeaMilestonesAndTasks | null;
  report: IdeaReport | null;
  playbookVersions: PlaybookVersion[];
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
