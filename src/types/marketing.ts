/**
 * Types for the Marketing Validation Engine (`mkt_*` tables).
 *
 * A generic, project-agnostic demand-validation pipeline
 * (Source → Outreach → Content → Capture → Measure) that attaches to any
 * row in `public.project`. This is a NEW, greenfield domain
 * (see docs/marketing/). Interfaces mirror the columns created in
 * supabase/migrations/20260601000000_marketing_validation_engine.sql.
 */

// ── Enums (mirror PostgreSQL enums) ───────────────────────────────────────────

export type MktFunnelMode = "b2b_outreach" | "consumer_capture" | "hybrid";

export type MktValidationStatus = "validating" | "killed" | "doubling_down";

export type MktChannel =
  | "email"
  | "linkedin"
  | "google_maps"
  | "instagram"
  | "facebook"
  | "reddit"
  | "x"
  | "social_discovery";

export type MktOutreachStatus =
  | "queued"
  | "sent"
  | "opened"
  | "replied"
  | "bounced"
  | "unsub";

export type MktSignalType = "quiz" | "waitlist" | "preorder";

export type MktContentStatus = "draft" | "scheduled" | "posted" | "failed";

/** Capture stages a landing page can enable, in escalating signal strength. */
export const CAPTURE_STAGES = ["quiz", "waitlist", "preorder"] as const;
export type CaptureStage = (typeof CAPTURE_STAGES)[number];

// ── Labels ────────────────────────────────────────────────────────────────────

export const FUNNEL_MODE_LABELS: Record<MktFunnelMode, string> = {
  b2b_outreach: "B2B Outreach",
  consumer_capture: "Consumer Capture",
  hybrid: "Hybrid",
};

export const VALIDATION_STATUS_LABELS: Record<MktValidationStatus, string> = {
  validating: "Validating",
  killed: "Killed",
  doubling_down: "Doubling Down",
};

export const CHANNEL_LABELS: Record<MktChannel, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  google_maps: "Google Maps",
  instagram: "Instagram",
  facebook: "Facebook",
  reddit: "Reddit",
  x: "X",
  social_discovery: "Social Discovery",
};

// ── Row interfaces ────────────────────────────────────────────────────────────

/** Per-idea funnel config (1:1 with `idea`). */
export interface MktValidation {
  id: string;
  idea_id: string;
  funnel_mode: MktFunnelMode;
  status: MktValidationStatus;
  positioning: string | null;
  icp_definition: Record<string, unknown>;
  /** Per-platform reference source URLs (competitor/inspiration accounts + posts). */
  reference_sources: ReferenceSources;
  /** Pre-registered hypothesis + thresholds that decide keep/pivot/kill. */
  decision_contract: DecisionContract;
  /** Cal.com (or similar) booking link used in outreach + post-capture CTA. */
  booking_url: string | null;
  enabled_capture_stages: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Decision Contract (pre-registered success criteria) ───────────────────────

/** One success metric with its threshold, minimum sample, and window. */
export interface ContractMetric {
  metric: string;
  threshold: number;
  unit: string;
  min_sample: number;
  window_days: number;
  why?: string;
}

/**
 * The decision contract: defined BEFORE data collection so the keep/pivot/kill
 * call is made against pre-registered criteria, not post-hoc rationalization.
 * Stored in mkt_validation.decision_contract (JSONB, {} when unset).
 */
export interface DecisionContract {
  riskiest_assumption?: string;
  success_metrics?: ContractMetric[];
  review_window_days?: number;
  kill_condition?: string;
  notes?: string;
}

// ── Structured quiz schema (aggregatable capture answers) ─────────────────────

/** One selectable option; `icp` marks it as an ICP-qualifying answer. */
export interface QuizOption {
  value: string;
  label: string;
  icp?: boolean;
}

/** One multiple-choice quiz question rendered on the landing page. */
export interface QuizQuestion {
  key: string;
  question: string;
  options: QuizOption[];
}

// ── Reference Sources (positioning research inputs) ───────────────────────────

/** All reference-source list keys. Each value is a list of full URLs. */
export type ReferenceSourceKey =
  | "websites"
  | "google_business_posts"
  | "instagram_users"
  | "instagram_posts"
  | "linkedin_users"
  | "linkedin_posts"
  | "youtube_channels"
  | "youtube_videos"
  | "facebook_users"
  | "facebook_posts"
  | "twitter_users"
  | "twitter_posts"
  | "tiktok_users"
  | "tiktok_posts";

/** Map of source key → list of full URLs. Stored in mkt_validation.reference_sources. */
export type ReferenceSources = Partial<Record<ReferenceSourceKey, string[]>>;

/** One list (column) within a platform group. */
export interface ReferenceListDef {
  key: ReferenceSourceKey;
  label: string;
  placeholder: string;
}

/** A platform group on the positioning page: two lists (accounts + posts). */
export interface ReferenceSourceGroup {
  platform: string;
  title: string;
  lists: ReferenceListDef[];
}

/**
 * Ordered platform groups rendered on the Positioning page. All inputs are
 * full URLs (not bare @handles), per the Apify actors that consume them.
 */
export const REFERENCE_SOURCE_GROUPS: ReferenceSourceGroup[] = [
  {
    platform: "websites",
    title: "Websites & Google Business",
    lists: [
      { key: "websites", label: "Website URLs", placeholder: "https://example.com" },
      { key: "google_business_posts", label: "Google Business profile URLs", placeholder: "https://www.google.com/maps/place/..." },
    ],
  },
  {
    platform: "instagram",
    title: "Instagram",
    lists: [
      { key: "instagram_users", label: "Instagram profile URLs", placeholder: "https://instagram.com/username" },
      { key: "instagram_posts", label: "Instagram post URLs", placeholder: "https://instagram.com/p/..." },
    ],
  },
  {
    platform: "linkedin",
    title: "LinkedIn",
    lists: [
      { key: "linkedin_users", label: "LinkedIn profile URLs", placeholder: "https://linkedin.com/in/username" },
      { key: "linkedin_posts", label: "LinkedIn post URLs", placeholder: "https://linkedin.com/posts/..." },
    ],
  },
  {
    platform: "youtube",
    title: "YouTube",
    lists: [
      { key: "youtube_channels", label: "YouTube channel URLs", placeholder: "https://youtube.com/@channel" },
      { key: "youtube_videos", label: "YouTube video URLs", placeholder: "https://youtube.com/watch?v=..." },
    ],
  },
  {
    platform: "facebook",
    title: "Facebook",
    lists: [
      { key: "facebook_users", label: "Facebook page/profile/group URLs", placeholder: "https://facebook.com/pagename" },
      { key: "facebook_posts", label: "Facebook post URLs", placeholder: "https://facebook.com/.../posts/..." },
    ],
  },
  {
    platform: "twitter",
    title: "Twitter / X",
    lists: [
      { key: "twitter_users", label: "X profile URLs", placeholder: "https://x.com/username" },
      { key: "twitter_posts", label: "X post URLs", placeholder: "https://x.com/username/status/..." },
    ],
  },
  {
    platform: "tiktok",
    title: "TikTok",
    lists: [
      { key: "tiktok_users", label: "TikTok profile URLs", placeholder: "https://tiktok.com/@username" },
      { key: "tiktok_posts", label: "TikTok video URLs", placeholder: "https://tiktok.com/@username/video/..." },
    ],
  },
];

/** A sourced contact (B2B). */
export interface MktProspect {
  id: string;
  idea_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  source: string | null;
  enrichment: Record<string, unknown>;
  score: number | null;
  /** ICP segment tag — reply rate per segment is audience-pivot data. */
  segment: string | null;
  status: string;
  source_run_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** A sourcing job (Apollo / Apify run). */
export interface MktSourceRun {
  id: string;
  idea_id: string;
  channel: MktChannel;
  query: Record<string, unknown>;
  status: string;
  result_count: number;
  apify_dataset_ref: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** An outreach campaign. */
export interface MktCampaign {
  id: string;
  idea_id: string;
  channel: MktChannel;
  name: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** A step within a campaign sequence. */
export interface MktSequenceStep {
  id: string;
  idea_id: string;
  campaign_id: string;
  step_order: number;
  delay_days: number;
  subject_tpl: string | null;
  body_tpl: string | null;
  ai_personalise: boolean;
  created_at: string;
  updated_at: string;
}

/** Per-prospect outbound message log. */
export interface MktOutreach {
  id: string;
  idea_id: string;
  prospect_id: string;
  campaign_id: string;
  step_order: number;
  status: MktOutreachStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  brevo_message_id: string | null;
  /** AI/manual classification of the reply — a classified "no" is pivot evidence. */
  reply_sentiment: "positive" | "neutral" | "negative" | "meeting_request" | null;
  created_at: string;
  updated_at: string;
}

// ── Paid traffic (mkt_ad_campaign) ────────────────────────────────────────────

export type MktAdPlatform = "meta" | "google" | "linkedin";
export type MktAdStatus = "draft" | "live" | "paused" | "ended";

export const AD_PLATFORM_LABELS: Record<MktAdPlatform, string> = {
  meta: "Meta (FB/IG)",
  google: "Google Ads",
  linkedin: "LinkedIn",
};

/** A paid ad campaign; attribution joins mkt_event/mkt_signal on utm_campaign. */
export interface MktAdCampaign {
  id: string;
  idea_id: string;
  landing_id: string | null;
  platform: MktAdPlatform;
  name: string;
  status: MktAdStatus;
  budget_cents: number;
  spend_cents: number;
  targeting_notes: string | null;
  utm_campaign: string;
  /** AI-generated ad copy variants ({ variants, targeting_tips }). */
  ad_creative: Record<string, unknown>;
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Interview Intelligence (mkt_interview) ────────────────────────────────────

export type MktInterviewSource = "outreach" | "network" | "panel" | "inbound" | "booking";

/** A customer interview with its transcript and AI analysis. */
export interface MktInterview {
  id: string;
  idea_id: string;
  prospect_id: string | null;
  participant_name: string | null;
  participant_role: string | null;
  segment: string | null;
  source: MktInterviewSource;
  conducted_at: string | null;
  recording_url: string | null;
  transcript: string | null;
  consent: boolean;
  /** Interview Analyst output (pains, quotes, Mom Test flags, evidence grade). */
  analysis: Record<string, unknown>;
  analyzed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Decision log (mkt_decision_log) ───────────────────────────────────────────

/** A dated keep/pivot/kill verdict with its rationale and metrics snapshot. */
export interface MktDecisionLog {
  id: string;
  idea_id: string;
  verdict: MktValidationStatus;
  rationale: string;
  metrics_snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

// ── Evidence weights (weighted validation score) ──────────────────────────────

/**
 * Evidence weight per signal/event type. Commitment-graded: a preorder is worth
 * 200 page views. Used by the Signals page weighted score.
 */
export const EVIDENCE_WEIGHTS: Record<string, number> = {
  view: 0.1,
  cta_click: 0.5,
  scroll_50: 0.1,
  scroll_90: 0.3,
  pricing_click: 5,
  quiz: 2,
  waitlist: 3,
  verified_bonus: 1,
  meeting_booked: 8,
  interview_strong: 10,
  preorder: 20,
};

/** Minimum sessions before conversion percentages are shown at all. */
export const MIN_SESSIONS_FOR_RATES = 30;

/** A content piece for multi-channel social distribution. */
export interface MktContent {
  id: string;
  idea_id: string;
  channels: string[];
  body: string | null;
  media_url: string | null;
  media_urls: string[];
  status: MktContentStatus;
  scheduled_at: string | null;
  posted_at: string | null;
  external_post_ids: Record<string, unknown>;
  ai_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Landing page config (public slug). */
export interface MktLanding {
  id: string;
  idea_id: string;
  slug: string;
  title: string | null;
  /** Full self-contained HTML document, rendered in a sandboxed iframe on /m/[slug]. */
  code_html: string | null;
  /** Structured qualification quiz; answers validate against this schema. */
  quiz_schema: QuizQuestion[];
  /** Tally (or similar) form URL embedded post-capture. */
  survey_url: string | null;
  capture_stages: string[];
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** A captured demand signal (the gold data). */
export interface MktSignal {
  id: string;
  idea_id: string;
  landing_id: string | null;
  type: MktSignalType;
  email: string | null;
  name: string | null;
  quiz_answers: Record<string, unknown>;
  stripe_session_id: string | null;
  amount_cents: number | null;
  utm: Record<string, unknown>;
  /** Set when the email passed double opt-in (only verified count toward thresholds). */
  verified_at: string | null;
  /** Post-capture micro-survey answers (Tally webhook). */
  survey_answers: Record<string, unknown>;
  /** Rule-based ICP fit from quiz_schema qualifying options; null = unknown. */
  icp_fit: boolean | null;
  created_at: string;
}

/** An analytics beacon event. */
export interface MktEvent {
  id: string;
  idea_id: string;
  landing_id: string | null;
  type: string;
  session_id: string | null;
  utm: Record<string, unknown>;
  created_at: string;
}

/** An unsubscribe / GDPR suppression record. */
export interface MktSuppression {
  id: string;
  idea_id: string;
  email: string;
  reason: string | null;
  created_at: string;
}

// ── Composite / view types ────────────────────────────────────────────────────

/** An idea row joined with its validation config (for the /marketing list). */
export interface MktIdeaListItem {
  idea_id: string;
  idea_name: string | null;
  idea_description: string | null;
  idea_version_name: string | null;
  project_id: string | null;
  project_name: string | null;
  validation: MktValidation | null;
  /** Optional funnel rollup, attached for the portfolio dashboard. */
  metrics?: MktFunnelMetrics | null;
}

/** Funnel metrics rolled up per project for the validation dashboard. */
export interface MktFunnelMetrics {
  views: number;
  clicks: number;
  quiz: number;
  waitlist: number;
  preorders: number;
  preorder_amount_cents: number;
  prospects: number;
  sent: number;
  opened: number;
  replied: number;
}
