/**
 * Brevo Transactional Email Utility
 * Source: docs/reference_docs/api-connectors.md — Brevo connector
 * All calls POST to https://api.brevo.com/v3/smtp/email using server-side API key.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Template IDs as documented in Bubble API connector
const TEMPLATE_IDS = {
  ACCOUNT_DETAILS: 6,
  INSTRUCTOR_BOOKING: 10,
  // The following are used in Bubble but template IDs not exposed in docs;
  // set via BREVO_TEMPLATE_PASSWORD_RESET / BREVO_TEMPLATE_MAGIC_LINK env vars.
  PASSWORD_RESET: Number(process.env.BREVO_TEMPLATE_PASSWORD_RESET ?? 0),
  MAGIC_LINK: Number(process.env.BREVO_TEMPLATE_MAGIC_LINK ?? 0),
} as const;

// ── Shared types ─────────────────────────────────────────────────────────────

export interface BrevoRecipient {
  email: string;
  name: string;
}

export interface BrevoResponse {
  messageId?: string;
  messageIds?: string[];
  status_code?: number;
  status_message?: string;
  returned_an_error: boolean;
}

// ── Internal helper ──────────────────────────────────────────────────────────

async function sendEmail(body: Record<string, unknown>): Promise<BrevoResponse> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Missing env: BREVO_API_KEY");

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message: (err as { message?: string }).message ?? res.statusText,
    };
  }

  const data = await res.json().catch(() => ({}));
  return {
    returned_an_error: false,
    messageId: (data as { messageId?: string }).messageId,
  };
}

// ── 1. Instructor Booking (templateId: 10) ────────────────────────────────────
// Source: "Brevo - Instructor Booking" call

export interface InstructorBookingParams {
  from: BrevoRecipient;
  to: BrevoRecipient;
  Event_Booking_Status: string;
  Event_Booking_Role: string;
  Event_Date: string;
  Event_Name: string;
  User_First_Name: string;
  Event_Location: string;
  Subject_Line: string;
  Custom_Message?: string;
}

export async function sendInstructorBookingEmail(
  params: InstructorBookingParams
): Promise<BrevoResponse> {
  const { from, to, ...templateParams } = params;
  return sendEmail({
    sender: from,
    to: [to],
    templateId: TEMPLATE_IDS.INSTRUCTOR_BOOKING,
    params: templateParams,
  });
}

// ── 2. Bulk Email via Template ────────────────────────────────────────────────
// Source: "Brevo Bulk Email via Template" call

export interface BulkEmailParams {
  from: BrevoRecipient;
  to: BrevoRecipient[];
  templateId: number;
  parameters_JSON: Record<string, unknown>;
}

export async function sendBulkEmailViaTemplate(
  params: BulkEmailParams
): Promise<BrevoResponse> {
  const { from, to, templateId, parameters_JSON } = params;
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: from,
      to,
      templateId,
      params: parameters_JSON,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message: (err as { message?: string }).message ?? res.statusText,
    };
  }

  const data = await res.json().catch(() => ({}));
  return {
    returned_an_error: false,
    messageIds: (data as { messageIds?: string[] }).messageIds,
  };
}

// ── 3. Account Details Email (templateId: 6) ─────────────────────────────────
// Source: "Brevo - Send Account Details Email" call — sent to new users

export interface AccountDetailsEmailParams {
  from: BrevoRecipient;
  to: BrevoRecipient;
  User_First_Name: string;
  Organisation_Email: string;
  Organisation_Name: string;
  User_Email: string;
  User_Password: string;
  Custom_Message?: string;
}

export async function sendAccountDetailsEmail(
  params: AccountDetailsEmailParams
): Promise<BrevoResponse> {
  const { from, to, ...templateParams } = params;
  return sendEmail({
    sender: from,
    to: [to],
    templateId: TEMPLATE_IDS.ACCOUNT_DETAILS,
    params: templateParams,
    htmlContent: "Hello",
    textContent: "Hello",
  });
}

// ── 4. Password Reset Email ───────────────────────────────────────────────────
// Source: "Brevo - Send Password Reset Link" call

export interface PasswordResetEmailParams {
  from: BrevoRecipient;
  to: BrevoRecipient;
  User_Link: string;
}

export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams
): Promise<BrevoResponse> {
  const { from, to, User_Link } = params;
  return sendEmail({
    sender: from,
    to: [to],
    templateId: TEMPLATE_IDS.PASSWORD_RESET,
    params: { User_Link },
  });
}

// ── 5. Magic Link Email ───────────────────────────────────────────────────────
// Source: "Brevo - Send Magic Link" call

export interface MagicLinkEmailParams {
  from: BrevoRecipient;
  to: BrevoRecipient;
  User_Link: string;
}

export async function sendMagicLinkEmail(
  params: MagicLinkEmailParams
): Promise<BrevoResponse> {
  const { from, to, User_Link } = params;
  return sendEmail({
    sender: from,
    to: [to],
    templateId: TEMPLATE_IDS.MAGIC_LINK,
    params: { User_Link },
  });
}

// ── 6. Blank Template (generic transactional) ────────────────────────────────
// Source: "Brevo - Blank Template" call

export interface BlankTemplateEmailParams {
  from: BrevoRecipient;
  to: BrevoRecipient;
  templateId: number;
  subject?: string;
  params?: Record<string, unknown>;
}

export async function sendBlankTemplateEmail(
  params: BlankTemplateEmailParams
): Promise<BrevoResponse> {
  const { from, to, templateId, subject, params: templateParams } = params;
  return sendEmail({
    sender: from,
    to: [to],
    templateId,
    ...(subject && { subject }),
    ...(templateParams && { params: templateParams }),
  });
}

// ── 6b. Raw transactional email (subject + HTML) ─────────────────────────────
// Used by the Marketing Validation Engine outreach worker. Sends arbitrary
// subject/body without a Brevo template. Falls back to BREVO_FROM_* env vars.

export interface RawEmailParams {
  to: BrevoRecipient;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: BrevoRecipient;
  /** Optional reply-to so prospect replies land in a monitored inbox. */
  replyTo?: BrevoRecipient;
  /** Brevo "tags" for filtering events in the dashboard / webhooks. */
  tags?: string[];
}

export async function sendRawEmail(params: RawEmailParams): Promise<BrevoResponse> {
  const from =
    params.from ?? {
      email: process.env.BREVO_FROM_EMAIL ?? "no-reply@move37.fun",
      name: process.env.BREVO_FROM_NAME ?? "Move37",
    };
  return sendEmail({
    sender: from,
    to: [params.to],
    subject: params.subject,
    htmlContent: params.htmlContent,
    textContent: params.textContent ?? params.htmlContent.replace(/<[^>]+>/g, " "),
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    ...(params.tags ? { tags: params.tags } : {}),
  });
}

// ── 7. Parent Package Booking DofE ───────────────────────────────────────────
// Source: "Brevo - Parent Package Booking DofE" call

export interface ParentPackageBookingParams {
  from: BrevoRecipient;
  to: BrevoRecipient;
  templateId: number;
  first_name: string;
  child_name: string;
  package_title: string;
  consent_form_url: string;
  parent_info_package_url: string;
  events_array: string[];
}

export async function sendParentPackageBookingEmail(
  params: ParentPackageBookingParams
): Promise<BrevoResponse> {
  const { from, to, templateId, ...templateParams } = params;
  return sendEmail({
    sender: from,
    to: [to],
    templateId,
    params: templateParams,
  });
}
