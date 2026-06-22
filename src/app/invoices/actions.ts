"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { sendRawEmail } from "@/lib/api/brevo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export interface InvoicePayload {
  code: string;
  company_or_user_name: string | null;
  document_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  client_name: string | null;
  service_price: number | null;
  due_date: string | null;
  service_title: string | null;
  service_description: string | null;
  account_details: string | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  total_time: number | null;
  emails: string[];
}

/**
 * Strip XSS vectors from HTML before storing invoice service descriptions.
 * Removes script/iframe blocks, event handler attributes, and javascript:/data: URLs.
 * TipTap's editor schema already constrains user input, but AI-generated strings
 * arrive as raw text and must be sanitized before persistence.
 */
function sanitizeInvoiceHtml(html: string | null): string | null {
  if (!html) return html;
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/\s+(?:href|src|action)\s*=\s*["']?\s*(?:javascript|data):[^"'\s>]*/gi, "");
}

export async function createInvoice(
  data: InvoicePayload
): Promise<{ error?: string; invoice?: { id: string } }> {
  const supabase: AnySupabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const sanitized = { ...data, service_description: sanitizeInvoiceHtml(data.service_description) };

  const { data: row, error } = await supabase
    .from("invoice")
    .insert({ ...sanitized, created_by: user.id, updated_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return { invoice: row };
}

export async function updateInvoice(
  id: string,
  patch: Partial<InvoicePayload>
): Promise<{ error?: string }> {
  const supabase: AnySupabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) {
      updates[k] = k === "service_description" ? sanitizeInvoiceHtml(v as string | null) : v;
    }
  }
  const { error } = await supabase.from("invoice").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return {};
}

export async function deleteInvoice(id: string): Promise<{ error?: string }> {
  const supabase: AnySupabase = await createClient();
  const { error } = await supabase.from("invoice").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return {};
}

/** Strip HTML tags/entities to plain text for AI summarization. */
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "AI Fill" for the invoice form. Pulls the current user's work feedback (both
 * project and internal-project) whose period falls within [startDate, endDate],
 * sums the logged hours (deterministic), and asks the AI to summarize the
 * "what I worked on" content into a client-facing service description.
 */
export async function aiFillInvoiceFromFeedback(input: {
  startDate: string | null;
  endDate: string | null;
}): Promise<{ totalTime?: number; serviceDescription?: string; error?: string }> {
  const supabase: AnySupabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { startDate, endDate } = input;
  if (!startDate || !endDate) {
    return { error: "Please set both Start Date and End Date first." };
  }
  if (startDate > endDate) {
    return { error: "Start Date must be on or before End Date." };
  }

  // `date` mirrors the work-period start, so filtering on it selects feedback
  // logged for work within the invoice window (and covers legacy rows).
  // Each table only owns its own FK column, so use separate select strings.
  const [proj, intl] = await Promise.all([
    supabase
      .from("project_work_feedback")
      .select("current_work, total_time, start_date, end_date, date, project_id")
      .eq("created_by", user.id)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("internal_project_work_feedback")
      .select("current_work, total_time, start_date, end_date, date, internal_project_id")
      .eq("created_by", user.id)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [...(proj.data ?? []), ...(intl.data ?? [])];
  if (rows.length === 0) {
    return { error: "No work feedback found for you in this date range." };
  }

  const totalTime = rows.reduce(
    (sum, r) => sum + (typeof r.total_time === "number" ? r.total_time : 0),
    0
  );

  // Resolve project names so the AI and the invoice description use readable names.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projIds = [...new Set((proj.data ?? []).map((r: any) => r.project_id).filter(Boolean))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intlIds = [...new Set((intl.data ?? []).map((r: any) => r.internal_project_id).filter(Boolean))];
  const [projNameRows, intlNameRows] = await Promise.all([
    projIds.length > 0
      ? supabase.from("project").select("id, name").in("id", projIds)
      : { data: [] },
    intlIds.length > 0
      ? supabase.from("internal_project").select("id, name").in("id", intlIds)
      : { data: [] },
  ]);
  const nameById: Record<string, string> = {};
  for (const p of (projNameRows.data ?? [])) nameById[p.id] = p.name;
  for (const p of (intlNameRows.data ?? [])) nameById[p.id] = p.name;

  // Group entries by project, tracking work items and hours per project.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byProject: Record<string, { items: string[]; hours: number }> = {};
  for (const r of rows) {
    const text = stripHtml(r.current_work);
    const id = r.project_id ?? r.internal_project_id ?? null;
    const projectName = (id && nameById[id]) ? nameById[id] : "General";
    if (!byProject[projectName]) byProject[projectName] = { items: [], hours: 0 };
    if (text) byProject[projectName].items.push(text);
    byProject[projectName].hours += typeof r.total_time === "number" ? r.total_time : 0;
  }

  const projectEntries = Object.entries(byProject)
    .map(([name, { items }]) =>
      items.length > 0
        ? `Project ${name}:\n${items.map((t) => `  - ${t}`).join("\n")}`
        : `Project ${name}: (no work log entries)`
    )
    .join("\n\n");

  const projectHoursEntries = Object.entries(byProject)
    .map(([name, { hours }]) => {
      const pct = totalTime > 0 ? Math.round((hours / totalTime) * 1000) / 10 : 0;
      return `  ${name}: ${hours}h (${pct}% of period)`;
    })
    .join("\n");

  if (!projectEntries) {
    return { totalTime };
  }

  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) {
    return { totalTime, error: "No AI service configured — filled hours only." };
  }

  const prompt = [
    "You are writing the 'Service description' section of a professional invoice.",
    `Create a client-facing description of the work performed between ${startDate} and ${endDate}.`,
    "Rules:",
    "- Use ONLY the information provided in the work log and hours data below. Do NOT invent, assume, or add anything not present.",
    "- Output valid HTML with no markdown, no code fences, and no prose outside the HTML.",
    "- Produce a single HTML table with three columns: Project | Tasks Summary | % of Period.",
    "- The table must have a <thead> row with those three column headers.",
    "- Each project gets one <tbody> <tr>. The 'Project' cell contains the project name. The 'Tasks Summary' cell contains 2–4 concise professional sentences summarizing the deliverables for that project (use the work log). The '% of Period' cell shows the percentage from the hours breakdown.",
    "- Style the table with inline CSS: width:100%; border-collapse:collapse; font-size:12px. Give <th> and <td> padding:6px 8px and border:1px solid #e5e7eb. Give <th> a background:#f3f4f6 and text-align:left.",
    "- Do NOT include raw hour numbers, dates, UUIDs, or internal jargon in the table.",
    "",
    "WORK LOG (grouped by project):",
    projectEntries,
    "",
    "HOURS BREAKDOWN (use these percentages in the '% of Period' column):",
    projectHoursEntries,
    "",
    'Respond ONLY with JSON of the exact shape: { "service_description": "<html string>" }',
  ].join("\n");

  const res = await generateAiJsonResponse<{ service_description: string }>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    // Rich-HTML output — use the high ceiling so the JSON isn't truncated mid-tag.
    maxTokens: 16384,
  });

  if (res.returned_an_error || !res.data?.service_description) {
    return { totalTime, error: res.error ?? "AI summary failed — filled hours only." };
  }

  const serviceDescription = sanitizeInvoiceHtml(res.data.service_description) ?? undefined;
  return { totalTime, serviceDescription };
}

/** Escape plain-text values interpolated into the email HTML body. */
function escapeText(s: string | null): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email the invoice PDF to one or more recipients via Brevo. The PDF is rendered
 * client-side and passed here as a bare base64 string. Best-effort: a delivery
 * failure is reported but never throws, so the invoice save is unaffected.
 */
export async function sendInvoiceEmail(input: {
  code: string;
  clientName: string | null;
  companyName: string | null;
  emails: string[];
  pdfBase64: string;
}): Promise<{ error?: string }> {
  const supabase: AnySupabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const recipients = Array.from(
    new Set((input.emails ?? []).map((e) => e.trim()).filter(Boolean))
  );
  if (recipients.length === 0) return {};
  if (!input.pdfBase64) return { error: "Missing invoice PDF." };

  const subject = `Invoice ${input.code}`;
  const company = escapeText(input.companyName) || "Move37";
  const forClient = input.clientName ? ` for ${escapeText(input.clientName)}` : "";
  const htmlContent = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1d2939;">
    <p>Hello,</p>
    <p>Please find attached invoice <strong>${escapeText(input.code)}</strong>${forClient}.</p>
    <p>Thank you,<br/>${company}</p>
  </div>`;
  const fileName = `invoice-${input.code.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`;

  const results = await Promise.allSettled(
    recipients.map((email) =>
      sendRawEmail({
        to: { email, name: email },
        subject,
        htmlContent,
        attachments: [{ content: input.pdfBase64, name: fileName }],
        tags: ["invoice"],
      })
    )
  );
  // sendRawEmail RESOLVES with { returned_an_error: true } on a non-OK Brevo
  // response (it does not throw), so a fulfilled result can still be a failure.
  const failed = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.returned_an_error)
  ).length;
  if (failed > 0) {
    return {
      error: `Invoice saved, but ${failed}/${recipients.length} email(s) could not be sent.`,
    };
  }
  return {};
}
