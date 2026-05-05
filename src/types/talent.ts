/**
 * Types and label maps for the Talent Pool feature.
 *
 * The underlying tables (`talent`, `talent_tool`, `talent_programming_language`,
 * `talent_referred_by`, `client_who_referred_this_talent`, `company`, `client`)
 * and the enum `os_tool` / `os_programming_language` come from the initial
 * schema (`supabase/migrations/20260304000000_initial_schema.sql`). The 4-hour
 * share-link mechanism (`code` + `code_expires_at`) and `updated_at` are added
 * by `20260426000010_talent_pool_share_and_operational_rls.sql`.
 */

import type { Database } from "@/lib/supabase/types";
import type { TalentLevel, TalentAuthorityLevel } from "@/types/projects";

export type { TalentLevel, TalentAuthorityLevel };
export {
  TALENT_LEVEL_LABELS,
  TALENT_AUTHORITY_LEVEL_LABELS,
} from "@/types/projects";

// ── Enums (mirrored from generated Supabase types) ───────────────────────────

export type Tool                = Database["public"]["Enums"]["os_tool"];
export type ProgrammingLanguage = Database["public"]["Enums"]["os_programming_language"];

export const TOOL_LABELS: Record<Tool, string> = {
  // AI coding
  claude_code:    "Claude Code",
  cursor:         "Cursor",
  antigravity:    "Antigravity",
  github_copilot: "GitHub Copilot",
  windsurf:       "Windsurf",
  codeium:        "Codeium",
  aider:          "Aider",
  devin:          "Devin",
  v0:             "v0",
  bolt:           "Bolt",
  tempo:          "Tempo",
  // No-code / low-code
  bubble:         "Bubble",
  webflow:        "Webflow",
  framer:         "Framer",
  flutterflow:    "FlutterFlow",
  lovable:        "Lovable",
  replit:         "Replit",
  weweb:          "WeWeb",
  adalo:          "Adalo",
  plasmic:        "Plasmic",
  retool:         "Retool",
  glide:          "Glide",
  softr:          "Softr",
  draftbit:       "Draftbit",
  wix:            "Wix",
  squarespace:    "Squarespace",
  shopify:        "Shopify",
  // Automation
  n8n:            "n8n",
  make:           "Make",
  zapier:         "Zapier",
  // Backend / data
  supabase:       "Supabase",
  xano:           "Xano",
  firebase:       "Firebase",
  hasura:         "Hasura",
  postgres:       "Postgres",
  mongodb:        "MongoDB",
  mysql:          "MySQL",
  redis:          "Redis",
  planetscale:    "PlanetScale",
  neon:           "Neon",
  airtable:       "Airtable",
  // Design
  figma_design:   "Figma (Design)",
  figma_make:     "Figma Make",
  sketch:         "Sketch",
  adobe_xd:       "Adobe XD",
  photoshop:      "Photoshop",
  illustrator:    "Illustrator",
  after_effects:  "After Effects",
  premiere:       "Premiere",
  miro:           "Miro",
  // DevOps / hosting
  vercel:         "Vercel",
  netlify:        "Netlify",
  github:         "GitHub",
  gitlab:         "GitLab",
  docker:         "Docker",
  kubernetes:     "Kubernetes",
  aws:            "AWS",
  gcp:            "GCP",
  azure:          "Azure",
  cloudflare:     "Cloudflare",
  // Productivity
  notion:         "Notion",
  slack:          "Slack",
  linear:         "Linear",
  jira:           "Jira",
  asana:          "Asana",
  monday:         "Monday.com",
  trello:         "Trello",
  clickup:        "ClickUp",
  loom:           "Loom",
  // AI / APIs
  openai:         "OpenAI",
  anthropic_api:  "Anthropic API",
  langchain:      "LangChain",
  pinecone:       "Pinecone",
  // Payments / comms / analytics
  stripe:         "Stripe",
  twilio:         "Twilio",
  sendgrid:       "SendGrid",
  segment:        "Segment",
  mixpanel:       "Mixpanel",
  amplitude:      "Amplitude",
  posthog:        "PostHog",
  // Misc legacy
  javascript:     "JavaScript",
};

export const PROGRAMMING_LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  javascript:   "JavaScript",
  typescript:   "TypeScript",
  python:       "Python",
  java:         "Java",
  go:           "Go",
  rust:         "Rust",
  csharp:       "C#",
  cpp:          "C++",
  php:          "PHP",
  ruby:         "Ruby",
  swift:        "Swift",
  kotlin:       "Kotlin",
  dart:         "Dart",
  react_native: "React Native",
  scala:        "Scala",
  elixir:       "Elixir",
  erlang:       "Erlang",
  haskell:      "Haskell",
  clojure:      "Clojure",
  fsharp:       "F#",
  ocaml:        "OCaml",
  julia:        "Julia",
  r_lang:       "R",
  matlab:       "MATLAB",
  lua:          "Lua",
  perl:         "Perl",
  bash:         "Bash",
  shell:        "Shell",
  powershell:   "PowerShell",
  objective_c:  "Objective-C",
  groovy:       "Groovy",
  assembly:     "Assembly",
  solidity:     "Solidity",
  graphql:      "GraphQL",
  sql:          "SQL",
  nosql:        "NoSQL",
  html_css:     "HTML / CSS",
  vba:          "VBA",
  crystal:      "Crystal",
  nim:          "Nim",
  zig:          "Zig",
  d_lang:       "D",
  fortran:      "Fortran",
  cobol:        "COBOL",
};

// ── Country list (talent.country is plain TEXT — same list as profile form) ─

export const COUNTRIES: string[] = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Belgium",
  "Bolivia","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic",
  "Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana",
  "Greece","Guatemala","Honduras","Hungary","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Japan","Jordan","Kenya","Lebanon","Malaysia",
  "Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Pakistan",
  "Panama","Paraguay","Peru","Philippines","Poland","Portugal","Romania","Russia",
  "Saudi Arabia","Serbia","Singapore","South Africa","South Korea","Spain",
  "Sweden","Switzerland","Taiwan","Thailand","Turkey","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Venezuela","Vietnam",
];

// ── Skill rows ──────────────────────────────────────────────────────────────

export interface TalentSkill    { tool: Tool;                       score: number | null }
export interface TalentLanguage { language: ProgrammingLanguage;    score: number | null }

// ── Public-shape entities ───────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  website: string | null;
}

export interface ClientProfile {
  id: string;
  name: string | null;
  picture: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  country: string | null;
}

export interface TalentRow {
  id: string;
  code: string | null;
  code_expires_at: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  picture: string | null;
  portfolio: string | null;
  country: string | null;
  current_job_position: string | null;
  level: TalentLevel | null;
  authority_level: TalentAuthorityLevel | null;
  current_company_id: string | null;
  created_at: string;

  // hydrated client-side from joins
  tools: TalentSkill[];
  programming_languages: TalentLanguage[];
  recommender_ids: string[];           // talent ids that referred this talent
  client_referrer_ids: string[];       // client ids that referred this talent
}

// ── Form input ──────────────────────────────────────────────────────────────

export interface TalentInput {
  name: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  portfolio: string | null;
  picture: string | null;
  country: string | null;
  current_job_position: string | null;
  level: TalentLevel | null;
  authority_level: TalentAuthorityLevel | null;
  current_company_id: string | null;
  tools: TalentSkill[];
  programming_languages: TalentLanguage[];
  recommender_ids: string[];
  client_referrer_ids: string[];
}

export type RecommenderInput = Omit<
  TalentInput,
  "tools" | "programming_languages" | "recommender_ids" | "client_referrer_ids"
>;

export interface ClientInput {
  name: string;
  country: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  picture: string | null;
}

export interface CompanyInput {
  name: string;
  website: string | null;
}
