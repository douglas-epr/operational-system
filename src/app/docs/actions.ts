"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type {
  DocsAttachment,
  OsAgreementStatus,
  PlaybookCommentStatus,
} from "@/types/docs";
import type { IdeaFull } from "@/types/idea-refiner";
import { loadIdeaFull } from "@/app/ideas-refiner/_lib/loadIdeaFull";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiTextResponse } from "@/lib/api/ai-dispatcher";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getUserIdOrError() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  return { user, supabase };
}

// ── Playbook versions ──────────────────────────────────────────────────────────

export async function savePlaybookVersion(
  versionId: string,
  content: string
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };
  const { error } = await result.supabase
    .from("idea_playbook_version")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", versionId);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  revalidatePath("/ideas-refiner");
  return {};
}

export async function deletePlaybookVersion(versionId: string): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase.from("idea_playbook_version").delete().eq("id", versionId);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  revalidatePath("/ideas-refiner");
  return {};
}

export async function createIdeaPlaybookVersion(
  ideaId: string,
  content: string
): Promise<{ error?: string; version?: { id: string; version_name: string | null; created_at: string; updated_at: string } }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };
  const { supabase: sb, user } = result;

  const { count } = await sb
    .from("idea_playbook_version")
    .select("id", { count: "exact", head: true })
    .eq("idea_id", ideaId);

  const versionName = `Version ${(count ?? 0) + 1}`;

  const { data, error } = await sb
    .from("idea_playbook_version")
    .insert({
      idea_id: ideaId,
      version_name: versionName,
      content,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("id, version_name, created_at, updated_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  revalidatePath("/ideas-refiner");
  return { version: data };
}

// ── Playbook comments ──────────────────────────────────────────────────────────

export async function addPlaybookComment(input: {
  playbookId: string;
  message: string;
  attachments: DocsAttachment[];
}): Promise<{ error?: string; comment?: { id: string } }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };

  const { data, error } = await result.supabase
    .from("idea_playbook_comment")
    .insert({
      playbook_id: input.playbookId,
      message:     input.message,
      attachments: input.attachments as unknown as Json,
      created_by:  result.user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { comment: data };
}

export async function editPlaybookComment(
  id: string,
  patch: { message?: string; attachments?: DocsAttachment[] }
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.message !== undefined) updates.message = patch.message;
  if (patch.attachments !== undefined) updates.attachments = patch.attachments as unknown as Json;
  const { error } = await result.supabase
    .from("idea_playbook_comment")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deletePlaybookComment(id: string): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };
  const { error } = await result.supabase
    .from("idea_playbook_comment")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function setPlaybookCommentStatus(
  id: string,
  status: PlaybookCommentStatus,
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };
  const { error } = await result.supabase
    .from("idea_playbook_comment")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Playbook comment replies ───────────────────────────────────────────────────

export async function addPlaybookCommentReply(input: {
  commentId: string;
  playbookId: string;
  message: string;
  attachments: DocsAttachment[];
}): Promise<{ error?: string; reply?: { id: string } }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getUserIdOrError()) as any;
  if (result.error) return { error: result.error };

  const { data, error } = await result.supabase
    .from("idea_playbook_comment_reply")
    .insert({
      idea_playbook_comment_id: input.commentId,
      playbook_id:              input.playbookId,
      message:                  input.message,
      attachments:              input.attachments as unknown as Json,
      created_by:               result.user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { reply: data };
}

export async function editPlaybookCommentReply(
  id: string,
  patch: { message?: string; attachments?: DocsAttachment[] }
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.message !== undefined) updates.message = patch.message;
  if (patch.attachments !== undefined) updates.attachments = patch.attachments as unknown as Json;
  const { error } = await supabase
    .from("idea_playbook_comment_reply")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deletePlaybookCommentReply(id: string): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase
    .from("idea_playbook_comment_reply")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Viewed-by helpers (RPC) ────────────────────────────────────────────────────

export async function markPlaybookCommentsViewed(playbookId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_playbook_comments_viewed", {
    p_playbook_id: playbookId,
  });
  if (error) return { error: error.message };
  return {};
}

export async function markPlaybookCommentRepliesViewed(
  commentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_playbook_comment_replies_viewed", {
    p_comment_id: commentId,
  });
  if (error) return { error: error.message };
  return {};
}

// ── Agreement templates ────────────────────────────────────────────────────────

export async function createAgreementTemplate(input: {
  name: string;
  content: string;
}): Promise<{ error?: string; template?: { id: string; name: string } }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  const { data, error } = await supabase
    .from("agreement_template")
    .insert({
      name:       input.name,
      content:    input.content,
      created_by: user!.id,
      updated_at: new Date().toISOString(),
    })
    .select("id, name")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { template: data };
}

export async function updateAgreementTemplate(
  id: string,
  patch: { name?: string; content?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.content !== undefined) updates.content = patch.content;
  const { error } = await supabase
    .from("agreement_template")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deleteAgreementTemplate(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("agreement_template").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Agreement versions (CRUD) ──────────────────────────────────────────────────

export async function createAgreement(input: {
  projectId: string;
  name: string;
  type: string | null;
  content: string;
  google_docs_url: string | null;
  status: OsAgreementStatus;
  authorized_users: string[];
  required_signers: string[];
}): Promise<{ error?: string; agreement?: { id: string } }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  const { data, error } = await supabase
    .from("project_agreement_version")
    .insert({
      project_id:       input.projectId,
      name:             input.name,
      type:             input.type,
      content:          input.content,
      google_docs_url:  input.google_docs_url,
      status:           input.status,
      authorized_users: input.authorized_users,
      required_signers: input.required_signers,
      created_by:       user!.id,
      updated_at:       new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { agreement: data };
}

export async function updateAgreement(
  id: string,
  patch: {
    name?: string;
    type?: string | null;
    content?: string;
    google_docs_url?: string | null;
    status?: OsAgreementStatus;
    authorized_users?: string[];
    required_signers?: string[];
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v;
  }
  const { error } = await supabase
    .from("project_agreement_version")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deleteAgreement(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_agreement_version")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Sign agreement ─────────────────────────────────────────────────────────────

/**
 * Calls the `sign_agreement` RPC, then appends a signature HTML block to the
 * agreement's `content`. Returns the new signed_by list + status.
 */
export async function signAgreement(
  id: string
): Promise<{ error?: string; signed_by?: string[]; status?: OsAgreementStatus }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  const { data: rpcData, error: rpcErr } = await supabase.rpc("sign_agreement", {
    p_agreement_id: id,
  });
  if (rpcErr) return { error: rpcErr.message };

  const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, signature")
    .eq("id", user!.id)
    .single();

  if (profile?.signature) {
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Signer";
    const stamp = new Date().toISOString();
    const block =
      `<div data-signature-block data-user="${user!.id}" data-signed-at="${stamp}" style="margin-top:24px;padding:12px;border-top:1px solid #e5e7eb;">` +
      `<img src="${profile.signature}" alt="signature" style="max-height:60px;display:block;margin-bottom:4px;" />` +
      `<p style="margin:0;font-size:12px;color:#6b7280;">${escapeHtml(fullName)} — ${stamp}</p>` +
      `</div>`;

    const { data: agreement } = await supabase
      .from("project_agreement_version")
      .select("content")
      .eq("id", id)
      .single();

    const newContent = (agreement?.content ?? "") + block;

    await supabase
      .from("project_agreement_version")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  revalidatePath("/docs");
  return {
    signed_by: (row?.signed_by as string[] | undefined) ?? [],
    status:    row?.status as OsAgreementStatus | undefined,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Project files (Docs › Files tab) ───────────────────────────────────────────

export async function createProjectFile(input: {
  projectId: string;
  name: string;
  attachments: DocsAttachment[];
}): Promise<{ error?: string; file?: { id: string } }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  const { data, error } = await supabase
    .from("project_file")
    .insert({
      project_id:  input.projectId,
      name:        input.name,
      attachments: input.attachments as unknown as Json,
      created_by:  user!.id,
      updated_at:  new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { file: data };
}

export async function updateProjectFile(
  id: string,
  patch: { name?: string; attachments?: DocsAttachment[] }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.attachments !== undefined) updates.attachments = patch.attachments as unknown as Json;
  const { error } = await supabase
    .from("project_file")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deleteProjectFile(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_file").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Project links (Docs › Links tab) ───────────────────────────────────────────

export async function createProjectLink(input: {
  projectId: string;
  name: string;
  url: string;
}): Promise<{ error?: string; link?: { id: string } }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  const { data, error } = await supabase
    .from("project_link")
    .insert({
      project_id: input.projectId,
      name:       input.name,
      url:        input.url,
      created_by: user!.id,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { link: data };
}

export async function updateProjectLink(
  id: string,
  patch: { name?: string; url?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.url !== undefined) updates.url = patch.url;
  const { error } = await supabase
    .from("project_link")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deleteProjectLink(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_link").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Project videos (Docs › Videos tab) ─────────────────────────────────────────

export async function createProjectVideo(input: {
  projectId: string;
  name: string;
  url: string;
}): Promise<{ error?: string; video?: { id: string } }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  const { data, error } = await supabase
    .from("project_video")
    .insert({
      project_id: input.projectId,
      name:       input.name,
      url:        input.url,
      created_by: user!.id,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/docs");
  return { video: data };
}

export async function updateProjectVideo(
  id: string,
  patch: { name?: string; url?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.url !== undefined) updates.url = patch.url;
  const { error } = await supabase
    .from("project_video")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

export async function deleteProjectVideo(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_video").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Work feedback (Docs › Work Feedback tab) ──────────────────────────────────
// DB table: project_work_feedback (formerly project_daily_feedback).

/** Human-readable work period: "start → end", or a single date fallback. */
function formatFeedbackPeriod(
  start: string | null,
  end: string | null,
  fallback: string
): string {
  if (start && end) return `${start} → ${end}`;
  if (start) return start;
  return fallback;
}

function buildFeedbackMessage(fields: {
  date: string;
  start_date: string | null;
  end_date: string | null;
  total_time: number | null;
  today_work: string | null;
  tomorrow_work: string | null;
  blockers: string | null;
  video_and_links: string | null;
}): string {
  const s = (label: string, html: string | null) =>
    `<p><strong>${label}</strong></p>${html ?? "<p>—</p>"}`;
  const period = formatFeedbackPeriod(fields.start_date, fields.end_date, fields.date);
  const totalLine =
    fields.total_time != null
      ? `<p><strong>Total time worked:</strong> ${fields.total_time}h</p>`
      : "";
  return [
    `<p><strong>📋 Work Feedback – ${period}</strong></p>`,
    totalLine,
    s("What I worked on", fields.today_work),
    s("What I will work on next", fields.tomorrow_work),
    s("Blockers", fields.blockers),
    s("Video &amp; Links", fields.video_and_links),
  ].join("");
}

export async function createDailyFeedback(input: {
  projectId: string;
  start_date: string | null;
  end_date: string | null;
  total_time: number | null;
  today_work: string | null;
  tomorrow_work: string | null;
  blockers: string | null;
  video_and_links: string | null;
}): Promise<{ error?: string; feedback?: { id: string } }> {
  const { user, supabase, error: authErr } = (await getUserIdOrError()) as Awaited<ReturnType<typeof getUserIdOrError>> & { error?: string };
  if (authErr) return { error: authErr };

  // The legacy NOT NULL `date` column mirrors the work-period start so existing
  // ordering/queries keep working.
  const legacyDate = input.start_date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("project_work_feedback")
    .insert({
      project_id:      input.projectId,
      date:            legacyDate,
      start_date:      input.start_date,
      end_date:        input.end_date,
      total_time:      input.total_time,
      today_work:      input.today_work,
      tomorrow_work:   input.tomorrow_work,
      blockers:        input.blockers,
      video_and_links: input.video_and_links,
      created_by:      user!.id,
      updated_at:      new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Create linked chat message so the feedback appears in the project's external chat.
  if (data?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceClient() as any;
    const { data: msg } = await svc
      .from("conversation_project_external_message")
      .insert({
        project_id:  input.projectId,
        created_by:  user!.id,
        author_type: "user",
        message:     buildFeedbackMessage({ ...input, date: legacyDate }),
        attachments: [],
        links:       [],
      })
      .select("id")
      .single();
    if (msg?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("project_work_feedback")
        .update({ conversation_project_external_message_id: msg.id })
        .eq("id", data.id);
    }
  }

  revalidatePath("/docs");
  return { feedback: data };
}

export async function updateDailyFeedback(
  id: string,
  patch: {
    start_date?: string | null;
    end_date?: string | null;
    total_time?: number | null;
    today_work?: string | null;
    tomorrow_work?: string | null;
    blockers?: string | null;
    video_and_links?: string | null;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v;
  }
  // Keep the legacy `date` column aligned with the work-period start.
  if (patch.start_date !== undefined && patch.start_date) {
    updates.date = patch.start_date;
  }
  const { error } = await supabase
    .from("project_work_feedback")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };

  // Sync updated fields to the linked chat message.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fb } = await (supabase as any)
    .from("project_work_feedback")
    .select("date, start_date, end_date, total_time, today_work, tomorrow_work, blockers, video_and_links, conversation_project_external_message_id")
    .eq("id", id)
    .single();
  if (fb?.conversation_project_external_message_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceClient() as any;
    await svc
      .from("conversation_project_external_message")
      .update({ message: buildFeedbackMessage(fb) })
      .eq("id", fb.conversation_project_external_message_id);
  }

  revalidatePath("/docs");
  return {};
}

export async function deleteDailyFeedback(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_work_feedback").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/docs");
  return {};
}

// ── Playbook from Sandbox idea ────────────────────────────────────────────────

function section(title: string, body: string | null | undefined): string {
  const hasBody = !!(body && body.trim());
  const content = hasBody ? body! : "<p><em>Not provided.</em></p>";
  return `<h2>${escapeHtml(title)}</h2>${content}`;
}

// ── Visual-styles helpers ────────────────────────────────────────────────────
//
// Render the structured fields of `idea_styles` (color tokens, typography
// scale, spacing scale, border radius, shadows) as readable HTML so the
// playbook surfaces them when the user clicks "Build from Sandbox idea".

type IdeaStylesShape = NonNullable<IdeaFull["styles"]>;

function renderQuickPalette(styles: IdeaStylesShape | null | undefined): string {
  if (!styles) return "";
  const swatches: Array<[string, string | null | undefined]> = [
    ["Primary",   styles.primary_color],
    ["Secondary", styles.secondary_color],
    ["Accent",    styles.accent_color],
    ["Neutral",   styles.neutral_color],
  ];
  const visible = swatches.filter(([, hex]) => !!hex);
  if (visible.length === 0) return "";
  const cells = visible
    .map(
      ([label, hex]) => `
        <td style="padding:8px 12px;border:1px solid #e5e7eb;vertical-align:top;">
          <div style="display:inline-block;width:24px;height:24px;border-radius:4px;background:${escapeHtml(hex!)};border:1px solid #d1d5db;vertical-align:middle;"></div>
          <strong style="margin-left:8px;">${escapeHtml(label)}</strong>
          <code style="margin-left:8px;background:#f3f4f6;padding:1px 4px;border-radius:3px;">${escapeHtml(hex!)}</code>
        </td>`
    )
    .join("");
  return `<h3>Quick Palette</h3><table style="border-collapse:collapse;margin:8px 0;"><tr>${cells}</tr></table>`;
}

function renderColorTokens(tokens: IdeaStylesShape["color_tokens"] | null | undefined): string {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return "";
  const rows = tokens
    .map((t) => {
      const shades = Array.isArray(t.shades) && t.shades.length > 0
        ? t.shades
            .map(
              (s) =>
                `<span style="display:inline-block;margin-right:6px;"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${escapeHtml(s.hex)};border:1px solid #d1d5db;vertical-align:middle;"></span> <code style="font-size:11px;">${escapeHtml(s.label)}</code></span>`
            )
            .join("")
        : "<em>—</em>";
      return `
        <tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;"><strong>${escapeHtml(t.name)}</strong></td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;"><code>${escapeHtml(t.hex)}</code></td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(t.role ?? "")}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;">${shades}</td>
        </tr>`;
    })
    .join("");
  return `<h3>Color Tokens</h3>
    <table style="border-collapse:collapse;width:100%;margin:8px 0;">
      <thead><tr>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Name</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Hex</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Role</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Shades</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderTypography(typo: IdeaStylesShape["typography"] | null | undefined): string {
  if (!typo) return "";
  const fonts = `
    <ul>
      ${typo.heading_font ? `<li><strong>Heading:</strong> ${escapeHtml(typo.heading_font)}</li>` : ""}
      ${typo.body_font ? `<li><strong>Body:</strong> ${escapeHtml(typo.body_font)}</li>` : ""}
      ${typo.mono_font ? `<li><strong>Mono:</strong> ${escapeHtml(typo.mono_font)}</li>` : ""}
    </ul>`;
  const scaleRows =
    Array.isArray(typo.scale) && typo.scale.length > 0
      ? typo.scale
          .map(
            (s) =>
              `<tr>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;"><strong>${escapeHtml(s.name)}</strong></td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${s.size_px}px</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${s.weight}</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${s.line_height}</td>
              </tr>`
          )
          .join("")
      : "";
  const scale = scaleRows
    ? `<table style="border-collapse:collapse;width:100%;margin:8px 0;">
        <thead><tr>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Name</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Size</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Weight</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Line height</th>
        </tr></thead>
        <tbody>${scaleRows}</tbody>
      </table>`
    : "";
  return `<h2>Typography</h2>${fonts}${scale}`;
}

function renderSpacing(spacing: IdeaStylesShape["spacing"] | null | undefined): string {
  if (!spacing) return "";
  const unit = spacing.unit_px ? `<p>Base unit: <code>${spacing.unit_px}px</code></p>` : "";
  const scale =
    Array.isArray(spacing.scale) && spacing.scale.length > 0
      ? `<p>Scale: ${spacing.scale.map((n) => `<code style="margin-right:6px;">${n}px</code>`).join("")}</p>`
      : "";
  if (!unit && !scale) return "";
  return `<h2>Spacing</h2>${unit}${scale}`;
}

function renderBorderRadius(r: IdeaStylesShape["border_radius"] | null | undefined): string {
  if (!r) return "";
  const items: Array<[string, string | undefined]> = [
    ["sm",   r.sm],
    ["md",   r.md],
    ["lg",   r.lg],
    ["xl",   r.xl],
    ["full", r.full],
  ];
  const rows = items
    .filter(([, v]) => !!v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;"><strong>${k}</strong></td><td style="padding:6px 10px;border:1px solid #e5e7eb;"><code>${escapeHtml(v!)}</code></td></tr>`
    )
    .join("");
  if (!rows) return "";
  return `<h2>Border Radius</h2>
    <table style="border-collapse:collapse;margin:8px 0;">${rows}</table>`;
}

function renderShadows(shadows: IdeaStylesShape["shadows"] | null | undefined): string {
  if (!shadows || !Array.isArray(shadows) || shadows.length === 0) return "";
  const rows = shadows
    .map(
      (s) =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;"><strong>${escapeHtml(s.name)}</strong></td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;"><code>${escapeHtml(s.css_value)}</code></td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(s.usage ?? "")}</td>
        </tr>`
    )
    .join("");
  return `<h2>Shadows</h2>
    <table style="border-collapse:collapse;width:100%;margin:8px 0;">
      <thead><tr>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Name</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">CSS</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Usage</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Playbook AI prompt ─────────────────────────────────────────────────────────

const PLAYBOOK_PROMPT_ID = "c1d2e3f4-0003-4000-8000-000000000001";

const FALLBACK_PLAYBOOK_PROMPT = `You are a senior technical writer creating a professional Product Playbook for a software product.

You will receive raw HTML data compiled from 4 sections of a product idea: PRD, Visual Styles, Database, and Project Milestones & Tasks.

Transform this raw data into a beautifully formatted, well-structured Playbook document — output HTML body content only (no <html>, <head>, <body> tags, no inline styles).

━━━ OUTPUT STRUCTURE ━━━

Produce exactly these 4 top-level sections using <h1> tags, in this order, each preceded by an <hr>:

1. <h1>PRD — Product Requirements Document</h1>
   Use <h2> for: App Overview, Objectives, Priority Personas, Essential Features, Core User Flows, Non-Functional Requirements, Out of Scope, Success Indicators, Phasing Notes

2. <h1>Visual Styles</h1>
   Use <h2> for: Logo & Branding, Brand Voice, Product Feeling, Color System, Typography, Spacing, Border Radius, Shadows, Iconography Style, Motion Principles
   Preserve all tables (color tokens, typography scale, shadows) from the source exactly.

3. <h1>Database</h1>
   Use <h2> for: Tables & Schema, Relationships, Important Notes
   Preserve any table or code structures from the source.

4. <h1>Project Milestones & Tasks</h1>
   Format each milestone as: <h2>Milestone N: [Name] — Est. Xh</h2>
   List tasks as <ul><li><strong>[Task Name]</strong> — Xh</li></ul>

━━━ FORMATTING RULES ━━━

- <h1> for the 4 main sections only
- <h2> for named subsections, <h3> for sub-categories within subsections
- <p> for all prose; <ul>/<li> for bullets; <ol>/<li> for numbered lists
- <table><thead><tbody> for structured data — always include a header row
- <strong> for key terms and labels; <em> for notes and secondary info
- <blockquote> for important callouts or design principles
- <hr> before each of the 4 main <h1> sections as a visual divider
- No inline styles — semantic HTML only
- Preserve ALL information — do not summarize or omit anything from the source

━━━ QUALITY RULES ━━━

- Write a brief introductory paragraph for each of the 4 main sections before subsections
- Improve grammar and sentence structure where source text is informal, but never change the meaning
- If a subsection has no data, write: <p><em>Not specified.</em></p>
- The overall document should read as a single cohesive product reference, not a dump of disconnected fields

The raw compiled idea data follows:
`;

async function getPlaybookPromptTemplate(): Promise<string> {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("prompt")
      .select("description")
      .eq("id", PLAYBOOK_PROMPT_ID)
      .maybeSingle();
    const desc = (data as { description: string | null } | null)?.description;
    if (desc?.trim()) return desc;
  } catch {
    // fall through to fallback
  }
  return FALLBACK_PLAYBOOK_PROMPT;
}

function compileIdeaToPlaybookHtml(bundle: IdeaFull): string {
  const prd      = bundle.prd;
  const database = bundle.database;
  const styles   = bundle.styles;
  const mTasks   = bundle.milestonesAndTasks;

  const parts: string[] = [];

  parts.push(`<h1>PRD</h1>`);
  parts.push(section("App Overview",              prd?.app_overview));
  parts.push(section("Objectives",                prd?.objectives));
  parts.push(section("Priority Personas",         prd?.priority_personas));
  parts.push(section("Essential Features",        prd?.essential_features));
  parts.push(section("Core User Flows",           prd?.user_flow));
  parts.push(section("Non-Functional Requirements", prd?.non_functional_reqs));
  parts.push(section("Out of Scope",              prd?.out_of_scope));
  parts.push(section("Success Indicators",        prd?.success_indicators));
  parts.push(section("Phasing Notes",             prd?.phasing_notes));

  parts.push(`<h1>Database</h1>`);
  parts.push(section("Tables & Schema", database?.tables_schema));
  parts.push(section("Relationships",   database?.relationships));
  parts.push(section("Important Notes", database?.notes));

  parts.push(`<h1>Visual Styles</h1>`);
  // Brand identity narrative
  parts.push(section("Logo & Branding", styles?.logo_branding));
  parts.push(section("Brand Voice",     styles?.brand_voice));
  parts.push(section("Product Feeling", styles?.product_feeling));

  // Color system — quick palette + structured tokens + legacy narrative.
  parts.push(`<h2>Color System</h2>`);
  parts.push(renderQuickPalette(styles));
  parts.push(renderColorTokens(styles?.color_tokens));
  if (styles?.color_palette && styles.color_palette.trim()) {
    parts.push(`<h3>Palette Notes</h3>${styles.color_palette}`);
  }

  // Typography
  parts.push(renderTypography(styles?.typography));

  // Spacing & layout
  parts.push(renderSpacing(styles?.spacing));
  parts.push(renderBorderRadius(styles?.border_radius));

  // Elevation
  parts.push(renderShadows(styles?.shadows));

  // Motion & iconography
  parts.push(section("Iconography Style", styles?.iconography_style));
  parts.push(section("Motion Principles", styles?.motion_principles));

  parts.push(`<h1>Project Milestones &amp; Tasks</h1>`);
  parts.push(section("Milestones & Tasks", mTasks?.content));

  return parts.join("");
}

export async function buildPlaybookFromIdea(
  projectId: string,
  ideaId: string,
): Promise<{
  error?: string;
  version?: { id: string; version_name: string | null; created_at: string; updated_at: string };
}> {
  const supabase = await createClient();
  const bundle = await loadIdeaFull(supabase, ideaId);
  if (!bundle) return { error: "Idea not found or not accessible." };

  // Three cases for the idea's existing project_id:
  //   - matches `projectId`: build, no relink needed (current behaviour).
  //   - NULL: build AND auto-link (set idea.project_id = projectId).
  //   - some OTHER project: refuse — the user shouldn't accidentally steal
  //     an idea that's already tied to a different project's playbook.
  const existingProjectId = bundle.idea.project_id;
  if (existingProjectId && existingProjectId !== projectId) {
    return { error: "Idea is linked to a different project." };
  }

  if (existingProjectId === null) {
    const { error: linkErr } = await supabase
      .from("idea")
      .update({ project_id: projectId })
      .eq("id", ideaId);
    if (linkErr) return { error: `Failed to link idea: ${linkErr.message}` };
  }

  const rawHtml = compileIdeaToPlaybookHtml(bundle);

  // Resolve AI config for the caller; fall back to raw compilation if unavailable.
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ai = await resolveAiConfig(supabaseUser, user.id);
  if (!ai) {
    // No AI configured — save the raw compiled HTML directly.
    return createIdeaPlaybookVersion(ideaId, rawHtml);
  }

  const promptTemplate = await getPlaybookPromptTemplate();
  const aiRes = await generateAiTextResponse({
    service: ai.service,
    apiKey: ai.apiKey,
    model: ai.model,
    prompt: promptTemplate + rawHtml,
  });

  const html = (!aiRes.returned_an_error && aiRes.text?.trim())
    ? aiRes.text
    : rawHtml;

  return createIdeaPlaybookVersion(ideaId, html);
}

// ── Idea picker (used by BuildFromIdeaModal) ───────────────────────────────────

import {
  listIdeasForProjectPicker as listIdeasForProjectPickerImpl,
  type IdeaPickerResult,
} from "@/lib/data/ideaPicker";

/**
 * Server action: list ideas for the playbook idea-picker modal.
 * Admin/manager only — non-elevated callers don't see the buttons that
 * open this picker, but we double-gate server-side too.
 */
export async function listIdeasForPlaybookPicker(
  projectId: string
): Promise<{ data?: IdeaPickerResult; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const role = (profile as { type?: string | null } | null)?.type ?? null;
  if (role !== "admin" && role !== "manager") {
    return { error: "Only admins and managers can build playbooks from ideas." };
  }
  const data = await listIdeasForProjectPickerImpl(supabase, projectId);
  return { data };
}
