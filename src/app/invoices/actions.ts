"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";

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
  start_date: string | null;
  end_date: string | null;
  total_time: number | null;
}

export async function createInvoice(
  data: InvoicePayload
): Promise<{ error?: string; invoice?: { id: string } }> {
  const supabase: AnySupabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error } = await supabase
    .from("invoice")
    .insert({ ...data, created_by: user.id, updated_at: new Date().toISOString() })
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
    if (v !== undefined) updates[k] = v;
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
  const selectCols = "today_work, total_time, start_date, end_date, date";
  const [proj, intl] = await Promise.all([
    supabase
      .from("project_work_feedback")
      .select(selectCols)
      .eq("created_by", user.id)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("internal_project_work_feedback")
      .select(selectCols)
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

  // Collect the "what I worked on" entries as plain text, tagged by period.
  const entries = rows
    .map((r) => {
      const text = stripHtml(r.today_work);
      if (!text) return null;
      const period =
        r.start_date && r.end_date
          ? `${r.start_date} → ${r.end_date}`
          : r.start_date ?? r.date;
      return `- (${period}) ${text}`;
    })
    .filter(Boolean)
    .join("\n");

  if (!entries) {
    // Hours still useful even with no descriptive content.
    return { totalTime };
  }

  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) {
    return { totalTime, error: "No AI service configured — filled hours only." };
  }

  const prompt = [
    "You are writing the 'Service description' section of a professional invoice.",
    `Summarize the following work-log entries into a concise, client-facing description of the work performed between ${startDate} and ${endDate}.`,
    "Write 2-4 short sentences or a few bullet points. Be specific but professional. Do NOT invent work that is not present in the entries. Do NOT include hours, dates, or internal jargon.",
    "",
    "WORK LOG ENTRIES:",
    entries,
    "",
    'Respond ONLY with JSON of the exact shape: { "service_description": string }',
  ].join("\n");

  const res = await generateAiJsonResponse<{ service_description: string }>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 2048,
  });

  if (res.returned_an_error || !res.data?.service_description) {
    return { totalTime, error: res.error ?? "AI summary failed — filled hours only." };
  }

  return { totalTime, serviceDescription: res.data.service_description };
}
