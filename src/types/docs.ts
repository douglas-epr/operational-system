/**
 * Types for the /docs page (Playbook + Agreements + Files + Links + Videos +
 * Daily Feedback + Invoices). Only Playbook and Agreements are implemented
 * this round — the rest render a "Coming soon" panel.
 *
 * Column shapes mirror `src/lib/supabase/types.ts`; attachment shape mirrors
 * `TaskCommentAttachment` in `src/types/projects.ts`.
 */

export type OsAgreementStatus =
  | "not_available"
  | "ready_to_sign"
  | "completed"
  | "archived";

export type OsAgreementType =
  | "nda"
  | "proposal_quotation"
  | "service_agreement"
  | "launch_handoff";

export const AGREEMENT_STATUS_LABELS: Record<OsAgreementStatus, string> = {
  not_available: "Not available",
  ready_to_sign: "Ready to sign",
  completed:     "Completed",
  archived:      "Archived",
};

export const AGREEMENT_STATUS_ORDER: OsAgreementStatus[] = [
  "completed",
  "ready_to_sign",
  "archived",
  "not_available",
];

export const AGREEMENT_TYPE_LABELS: Record<OsAgreementType, string> = {
  nda:                "NDA",
  proposal_quotation: "Proposal / Quotation",
  service_agreement:  "Service Agreement",
  launch_handoff:     "Launch & Handoff",
};

export type DocsTabKey =
  | "playbook"
  | "agreements"
  | "files"
  | "links"
  | "videos"
  | "daily_feedback";

export const DOCS_TAB_LABELS: Record<DocsTabKey, string> = {
  playbook:       "Playbook",
  agreements:     "Agreements",
  files:          "Files",
  links:          "Links",
  videos:         "Videos",
  daily_feedback: "Work Feedback",
};

export const DOCS_TAB_ORDER: DocsTabKey[] = [
  "playbook",
  "agreements",
  "files",
  "links",
  "videos",
  "daily_feedback",
];

export interface DocsAttachment {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface PlaybookVersion {
  id: string;
  idea_id: string | null;
  version_name: string | null;
  content: string | null;
  google_docs_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type PlaybookCommentStatus = "pending" | "solved";

export const PLAYBOOK_COMMENT_STATUS_LABELS: Record<PlaybookCommentStatus, string> = {
  pending: "Pending",
  solved:  "Solved",
};

export interface PlaybookComment {
  id: string;
  playbook_id: string;
  message: string | null;
  attachments: DocsAttachment[];
  status: PlaybookCommentStatus;
  created_by: string;
  viewed_by: string[];
  created_at: string;
  updated_at: string;
}

export interface PlaybookCommentReply {
  id: string;
  playbook_id: string;
  idea_playbook_comment_id: string;
  message: string | null;
  attachments: DocsAttachment[];
  created_by: string;
  viewed_by: string[];
  created_at: string;
  updated_at: string;
}

export interface AgreementTemplate {
  id: string;
  name: string;
  content: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AgreementVersion {
  id: string;
  project_id: string | null;
  name: string | null;
  /** FK → agreement_template.id (null when the agreement has no template). */
  type: string | null;
  content: string | null;
  google_docs_url: string | null;
  status: OsAgreementStatus;
  authorized_users: string[];
  required_signers: string[];
  signed_by: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  attachments: DocsAttachment[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectLink {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectVideo {
  id: string;
  project_id: string | null;
  name: string | null;
  description: string | null;
  url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// DB table: project_work_feedback (formerly project_daily_feedback).
export interface ProjectDailyFeedback {
  id: string;
  project_id: string | null;
  date: string;               // ISO yyyy-mm-dd (legacy single date)
  start_date: string | null;  // ISO yyyy-mm-dd — work period start
  end_date: string | null;    // ISO yyyy-mm-dd — work period end
  total_time: number | null;  // total hours worked in the interval
  current_work: string | null;
  next_work: string | null;
  blockers: string | null;
  video_and_links: string | null;
  emails: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InternalProjectFile {
  id: string;
  internal_project_id: string;
  name: string;
  description: string | null;
  attachments: DocsAttachment[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InternalProjectLink {
  id: string;
  internal_project_id: string;
  name: string;
  description: string | null;
  url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InternalProjectVideo {
  id: string;
  internal_project_id: string | null;
  name: string | null;
  description: string | null;
  url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// DB table: internal_project_work_feedback (formerly internal_project_daily_feedback).
export interface InternalProjectDailyFeedback {
  id: string;
  internal_project_id: string | null;
  date: string;
  start_date: string | null;  // ISO yyyy-mm-dd — work period start
  end_date: string | null;    // ISO yyyy-mm-dd — work period end
  total_time: number | null;  // total hours worked in the interval
  current_work: string | null;
  next_work: string | null;
  blockers: string | null;
  video_and_links: string | null;
  emails: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  created_by: string;
  code: string;
  company_or_user_name: string | null;
  document_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  client_name: string | null;
  service_price: number | null;
  due_date: string | null;           // ISO yyyy-mm-dd
  service_title: string | null;
  service_description: string | null;
  account_details: string | null;    // free-form bank/payment details (replaces swift+iban)
  currency: string | null;           // currency symbol e.g. "$", "€", "£"
  start_date: string | null;         // ISO yyyy-mm-dd — work period start
  end_date: string | null;           // ISO yyyy-mm-dd — work period end
  total_time: number | null;         // total hours worked in the interval
  emails: string[];                  // recipients notified with the invoice PDF on save
  swift_code: string | null;         // legacy — no longer edited in the form
  iban_code: string | null;          // legacy — no longer edited in the form
  created_at: string;
  updated_at: string;
}

/** Single aggregated status badge for a group of agreements of the same type. */
export function aggregateAgreementStatus(
  agreements: Pick<AgreementVersion, "status">[]
): OsAgreementStatus {
  if (agreements.length === 0) return "not_available";
  for (const s of AGREEMENT_STATUS_ORDER) {
    if (agreements.some((a) => a.status === s)) return s;
  }
  return "not_available";
}
