/**
 * Shared TypeScript interfaces for the projects feature.
 * Column names are taken directly from the migration SQL.
 * Replace with generated Supabase types once migration is executed and
 * `npx supabase gen types` is run.
 */

export type ProjectStatus =
  | "prospecting"
  | "not_started"
  | "in_progress"
  | "done"
  | "blocked"
  | "archived"
  | "lost_deal";

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_qa"
  | "done"
  | "blocked";

export type TaskType =
  | "internal_checklist"
  | "stages_checking"
  | "developer_tasks"
  | "client_requests"
  | "qa_requests";

export type TaskLevel = "level_1" | "level_2" | "level_3" | "level_4";

export type UserType =
  | "admin"
  | "manager"
  | "operational"
  | "developer"
  | "client"
  | "qa"
  | "referrer"
  | "lead";

export type TalentLevel =
  | "agency_owner"
  | "cto"
  | "tech_lead"
  | "senior"
  | "mid_level"
  | "junior";

export type TalentAuthorityLevel =
  | "rock_star"
  | "known"
  | "unknown"
  | "rising_star"
  | "explorer";

export const TALENT_LEVEL_LABELS: Record<TalentLevel, string> = {
  agency_owner: "Agency / Company Owner (CEO)",
  cto:          "CTO",
  tech_lead:    "Tech Lead",
  senior:       "Senior",
  mid_level:    "Mid-Level",
  junior:       "Junior",
};

export const TALENT_AUTHORITY_LEVEL_LABELS: Record<TalentAuthorityLevel, string> = {
  rock_star:   "Rock Star",
  known:       "Known (Champion)",
  unknown:     "Unknown (Builder Pro)",
  rising_star: "Rising Star",
  explorer:    "Explorer",
};

export interface Talent {
  id: string;
  name: string | null;
  email: string | null;
  level: TalentLevel | null;
  current_company_id: string | null;
}

export type ProjectProgram =
  | "sandbox_launch"
  | "market_ready_product"
  | "scale_ready_system"
  | "subscription";

export const PROGRAM_LABELS: Record<ProjectProgram, string> = {
  sandbox_launch:       "Sandbox Launch",
  market_ready_product: "Market Ready Product",
  scale_ready_system:   "Scale Ready System",
  subscription:         "Subscription",
};

export type ProjectStage =
  | "discovery_call"
  | "system_activation"
  | "nda"
  | "info_gathering_meeting"
  | "client_slack_channel"
  | "playbook"
  | "proposal"
  | "service_agreement"
  | "kickoff_meeting"
  | "initial_invoice"
  | "screens_development"
  | "prototype_development"
  | "video_explaining"
  | "developer_search_onboarding"
  | "app_development"
  | "launch_handoff"
  | "final_invoice"
  | "completed";

export type RecommendedBy = "dev_agency_owner" | "client";

export const RECOMMENDED_BY_LABELS: Record<RecommendedBy, string> = {
  dev_agency_owner: "Dev./Agency Owner",
  client: "Client",
};

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  type: UserType | null;
  signature?: string | null;
  theme?: string | null;
}

export interface UserRow extends UserProfile {
  email: string;
  country: string | null;
  created_at: string;
}

export const USER_TYPE_LABELS: Record<UserType, string> = {
  admin:       "Admin",
  manager:     "Manager",
  operational: "Operational",
  developer:   "Developer",
  client:      "Client",
  qa:          "QA",
  referrer:    "Referrer",
  lead:        "Lead",
};

export interface TaskAssignee {
  user_id: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

export interface Task {
  id: string;
  project_id: string | null;
  parent_task_id: string | null;
  name: string | null;
  order: number | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  start_date_real: string | null;
  end_date_real: string | null;
  real_time: number | null;
  estimated_time: number | null;
  type: TaskType | null;
  level: TaskLevel | null;
  status: TaskStatus;
  created_by: string | null;
  task_assignees: TaskAssignee[];
}

export interface Project {
  id: string;
  name: string | null;
  picture: string | null;
  status: ProjectStatus;
  stage: ProjectStage | null;
  program: ProjectProgram | null;
  start_date_real: string | null;
  end_date_real: string | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  estimated_time: number | null;
  real_time: number | null;
  price: number | null;
  referrer_commission: number | null;
  description: string | null;
  authorized_users: string[];
  change_automatically_project_estimated_time: boolean;
  change_automatically_milestone_estimated_time: boolean;
  change_automatically_project_start_end_dates: boolean;
  change_automatically_milestone_start_end_dates: boolean;
  recommended_by: RecommendedBy | null;
  talent_who_recommended_id: string | null;
  client_who_recommended_id: string | null;
  company_that_recommended_id: string | null;
  referrer_id: string | null;
  created_at: string;
  client_developer_estimated_time: number | null;
  client_developer_real_time: number | null;
  qa_developer_estimated_time: number | null;
  qa_developer_real_time: number | null;
  qa_tester_estimated_time: number | null;
  qa_tester_real_time: number | null;
}

export interface TimeTrack {
  id: string;
  /** Renamed from owner_id (Part 2 item 33). */
  assignee_id: string;
  task_id: string | null;
  project_id: string | null;
  start_date: string | null;
  start_time_min: number | null;
  end_time_min: number | null;
  time_spent_h: number | null;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

export interface TaskCommentAttachment {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  project_id: string;
  /** Renamed from owner_id (Part 2 item 32). */
  created_by: string;
  message: string;
  attachments: TaskCommentAttachment[];
  /** Renamed from edited_at (Part 2 item 32). */
  updated_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

export interface QATimeTrack {
  id: string;
  /** Renamed from owner_user_id (Part 2 item 42). */
  assignee_id: string;
  task_id: string | null;
  project_id: string | null;
  start_date: string | null;
  start_time_min: number | null;
  end_time_min: number | null;
  time_spent_h: number | null;
  paid: boolean;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

// ── Time helpers ───────────────────────────────────────────────────────────────

/** Convert minutes-from-midnight to "HH:MM" */
export function minToTimeStr(min: number): string {
  return `${Math.floor(min / 60).toString().padStart(2, "0")}:${(min % 60).toString().padStart(2, "0")}`;
}

/** Convert "HH:MM" to minutes-from-midnight */
export function timeStrToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Generate time options every 30 minutes */
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Human-readable labels for each project stage enum value */
export const STAGE_LABELS: Record<ProjectStage, string> = {
  discovery_call: "Discovery meeting",
  system_activation: "System activation (Blur Studio internal tool)",
  nda: "Non-Disclosure agreement (NDA)",
  info_gathering_meeting: "Information gathering meeting",
  client_slack_channel: "Client Slack channel creation",
  playbook: "Playbook development",
  proposal: "Proposal/Quotation",
  service_agreement: "Service Agreement",
  kickoff_meeting: "Kickoff meeting with client",
  initial_invoice: "Initial invoice",
  screens_development: "Screens development",
  prototype_development: "Prototype development",
  video_explaining: "Video explaining the prototype",
  developer_search_onboarding: "Developer search & onboarding",
  app_development: "App development",
  launch_handoff: "Launch & Handoff",
  final_invoice: "Final invoice",
  completed: "Completed",
};

/** Ordered list of stages (for the checklist) */
export const STAGE_ORDER: ProjectStage[] = Object.keys(STAGE_LABELS) as ProjectStage[];

/** Calculate project schedule progress badge */
export function getProgressBadge(
  realTime: number | null,
  estimatedTime: number | null
): { label: string; color: "green" | "yellow" | "red" } {
  if (!estimatedTime || estimatedTime === 0) {
    return { label: "No estimate", color: "yellow" };
  }
  const actual = realTime ?? 0;
  const pct = Math.round((1 - actual / estimatedTime) * 100);
  if (pct > 0) return { label: `${pct}% Ahead of Schedule`, color: "green" };
  if (pct < 0) return { label: `${Math.abs(pct)}% Behind Schedule`, color: "red" };
  return { label: "0% On Schedule", color: "yellow" };
}

/** Tabs visible per user type */
export type TabKey = "stages" | "developer" | "client_requests" | "qa_requests";

export const TAB_LABELS: Record<TabKey, string> = {
  stages: "Stages Checking",
  developer: "Main Tasks",
  client_requests: "Client Requests",
  qa_requests: "QA Requests",
};

/** Task-based + timeline schedule progress badge */
export function getScheduleProgressBadge(
  project: { start_date_estimated: string | null; end_date_estimated: string | null },
  taskProgress: { totalEst: number; doneOrQaEst: number } | null
): { label: string; color: "green" | "yellow" | "red" } {
  const totalEst = taskProgress?.totalEst ?? 0;
  const doneOrQaEst = taskProgress?.doneOrQaEst ?? 0;

  if (!project.start_date_estimated || !project.end_date_estimated) {
    return { label: "No estimate", color: "yellow" };
  }

  const taskPct = totalEst > 0 ? (doneOrQaEst / totalEst) * 100 : 0;

  const start = new Date(project.start_date_estimated).getTime();
  const end   = new Date(project.end_date_estimated).getTime();
  const today = Date.now();
  const span  = end - start;
  const timelinePct = span > 0 ? ((today - start) / span) * 100 : 0;

  const diff = Math.round(taskPct - timelinePct);
  if (diff > 0)  return { label: `${diff}% Ahead`,   color: "green" };
  if (diff < 0)  return { label: `${Math.abs(diff)}% Behind`, color: "red" };
  return { label: "On Schedule", color: "yellow" };
}

export function getVisibleTabs(userType: UserType | null): TabKey[] {
  if (!userType) return ["stages"];
  if (userType === "admin" || userType === "manager") {
    return ["stages", "developer", "client_requests", "qa_requests"];
  }
  if (userType === "developer") {
    return ["stages", "developer", "client_requests", "qa_requests"];
  }
  if (userType === "qa") {
    return ["qa_requests"];
  }
  if (userType === "client") {
    return ["stages", "client_requests"];
  }
  return ["stages"];
}
