"use server";

/**
 * Interview Intelligence actions (signal-accuracy report, Part F).
 *
 * Transcripts are the highest-fidelity early ICP evidence. The Analyst applies
 * Mom Test discipline per interview (past behavior = evidence, hypothetical
 * praise = flagged); the Synthesizer aggregates themes across all interviews
 * into keep/pivot inputs. Synthesis is cached in mkt_research_cache
 * (source_key 'interview_synthesis') so it survives reloads without a new table.
 *
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import type { MktInterview, MktInterviewSource } from "@/types/marketing";

const STAFF = ["admin", "manager"] as const;
const ANALYST_PROMPT = "1. Interview Analyst";
const SYNTH_PROMPT = "2. Interview Synthesizer";
const SYNTH_CACHE_KEY = "interview_synthesis";

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const };
  const { data: profile } = await supabase.from("profiles").select("type").eq("id", user.id).single();
  if (!STAFF.includes((profile?.type ?? "") as (typeof STAFF)[number])) {
    return { error: "Forbidden." as const };
  }
  return { supabase, user };
}

async function loadPrompt(name: string): Promise<string | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("prompt").select("description").eq("name", name).maybeSingle();
  return (data as { description: string } | null)?.description ?? null;
}

function fill(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "(not specified)");
  }
  return result;
}

export interface SaveInterviewInput {
  id?: string;
  participant_name?: string | null;
  participant_role?: string | null;
  segment?: string | null;
  source?: MktInterviewSource;
  conducted_at?: string | null;
  transcript?: string | null;
  consent?: boolean;
}

/** Create or update an interview record. */
export async function saveInterview(
  ideaId: string,
  input: SaveInterviewInput
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const row: Record<string, unknown> = {
    participant_name: input.participant_name?.trim() || null,
    participant_role: input.participant_role?.trim() || null,
    segment: input.segment?.trim() || null,
    source: input.source ?? "network",
    conducted_at: input.conducted_at || null,
    transcript: input.transcript ?? null,
    consent: input.consent ?? false,
  };

  let result;
  if (input.id) {
    result = await ctx.supabase
      .from("mkt_interview" as never)
      .update(row as never)
      .eq("id", input.id)
      .eq("idea_id", ideaId)
      .select("id")
      .single();
  } else {
    result = await ctx.supabase
      .from("mkt_interview" as never)
      .insert({ ...row, idea_id: ideaId, created_by: ctx.user.id } as never)
      .select("id")
      .single();
  }
  if (result.error) return { error: result.error.message };
  revalidatePath(`/marketing/${ideaId}/interviews`);
  return { id: (result.data as unknown as { id: string }).id };
}

/** Delete an interview. */
export async function deleteInterview(
  ideaId: string,
  interviewId: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_interview" as never)
    .delete()
    .eq("id", interviewId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/interviews`);
  return {};
}

/**
 * Run the Interview Analyst on one transcript. Every extracted claim must cite
 * a verbatim quote; hypothetical praise is flagged, not counted.
 */
export async function analyzeInterview(
  ideaId: string,
  interviewId: string
): Promise<{ error?: string; analysis?: Record<string, unknown> }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const template = await loadPrompt(ANALYST_PROMPT);
  if (!template) return { error: `Prompt "${ANALYST_PROMPT}" not found in database.` };

  const [{ data: ivRow }, { data: v }, { data: ideaRow }] = await Promise.all([
    ctx.supabase
      .from("mkt_interview" as never)
      .select("*")
      .eq("id", interviewId)
      .eq("idea_id", ideaId)
      .maybeSingle(),
    ctx.supabase
      .from("mkt_validation" as never)
      .select("positioning, icp_definition")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    ctx.supabase.from("idea").select("name").eq("id", ideaId).maybeSingle(),
  ]);

  const iv = ivRow as unknown as MktInterview | null;
  if (!iv) return { error: "Interview not found." };
  if (!iv.transcript?.trim()) return { error: "Paste the transcript before analyzing." };

  const validation = v as { positioning: string | null; icp_definition: Record<string, string> | null } | null;
  const dna = validation?.icp_definition ?? {};
  // Structured criteria when defined; otherwise the target-audience prose.
  const qualifying =
    (dna as Record<string, unknown>).qualifying_criteria
      ? JSON.stringify((dna as Record<string, unknown>).qualifying_criteria)
      : dna.target_audience ?? "";

  const prompt = fill(template, {
    idea_name: (ideaRow as { name: string | null } | null)?.name ?? "",
    positioning: validation?.positioning ?? "",
    qualifying_criteria: qualifying,
    participant_name: iv.participant_name ?? "Anonymous",
    participant_role: iv.participant_role ?? "unknown role",
    segment: iv.segment ?? "unsegmented",
    transcript: iv.transcript.slice(0, 60_000),
  });

  const res = await generateAiJsonResponse<Record<string, unknown>>({
    service: cfg.service,
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt,
  });
  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI analysis failed." };
  }

  const { error } = await ctx.supabase
    .from("mkt_interview" as never)
    .update({ analysis: res.data, analyzed_at: new Date().toISOString() } as never)
    .eq("id", interviewId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };

  revalidatePath(`/marketing/${ideaId}/interviews`);
  return { analysis: res.data };
}

/**
 * Run the Synthesizer across all analyzed interviews. Result is cached in
 * mkt_research_cache (source_key 'interview_synthesis') and surfaced on the
 * Signals/dashboard side as decision input.
 */
export async function synthesizeInterviews(
  ideaId: string
): Promise<{ error?: string; synthesis?: Record<string, unknown> }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const template = await loadPrompt(SYNTH_PROMPT);
  if (!template) return { error: `Prompt "${SYNTH_PROMPT}" not found in database.` };

  const [{ data: rows }, { data: v }, { data: ideaRow }] = await Promise.all([
    ctx.supabase
      .from("mkt_interview" as never)
      .select("participant_role, segment, analysis, analyzed_at, created_at")
      .eq("idea_id", ideaId)
      .not("analyzed_at", "is", null)
      .order("created_at", { ascending: true }),
    ctx.supabase
      .from("mkt_validation" as never)
      .select("positioning")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    ctx.supabase.from("idea").select("name").eq("id", ideaId).maybeSingle(),
  ]);

  const analyzed = (rows ?? []) as unknown as {
    participant_role: string | null;
    segment: string | null;
    analysis: Record<string, unknown>;
  }[];
  if (analyzed.length === 0) {
    return { error: "Analyze at least one interview first." };
  }

  const analysesJson = JSON.stringify(
    analyzed.map((r) => ({ role: r.participant_role, segment: r.segment, ...r.analysis })),
    null,
    2
  ).slice(0, 80_000);

  const prompt = fill(template, {
    idea_name: (ideaRow as { name: string | null } | null)?.name ?? "",
    positioning: (v as { positioning: string | null } | null)?.positioning ?? "",
    interview_count: String(analyzed.length),
    analyses_json: analysesJson,
  });

  const res = await generateAiJsonResponse<Record<string, unknown>>({
    service: cfg.service,
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt,
  });
  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI synthesis failed." };
  }

  // Cache so the panel survives reloads (reuses the research-cache table).
  await ctx.supabase.from("mkt_research_cache" as never).upsert(
    {
      idea_id: ideaId,
      source_key: SYNTH_CACHE_KEY,
      digest: String((res.data as { summary?: string }).summary ?? ""),
      raw: res.data,
      scraped_at: new Date().toISOString(),
    } as never,
    { onConflict: "idea_id,source_key" }
  );

  revalidatePath(`/marketing/${ideaId}/interviews`);
  return { synthesis: res.data };
}
