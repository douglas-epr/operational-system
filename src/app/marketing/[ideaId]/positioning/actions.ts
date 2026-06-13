"use server";

/**
 * Positioning page actions — save validation settings (decision + positioning)
 * + brand DNA (stored in mkt_validation.icp_definition JSONB).
 *
 * AI auto-fill reads the prompt from the Supabase `prompt` table
 * (name = "Brand DNA AI Fill") and uses {{variable}} substitution from
 * the idea's linked data (idea_icp, idea_styles, idea_structure_align).
 *
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { getFunnelMetrics } from "@/lib/marketing/admin";
import type {
  DecisionContract,
  MktValidationStatus,
  ReferenceSources,
} from "@/types/marketing";

const STAFF = ["admin", "manager"] as const;
const BRAND_DNA_PROMPT_NAME = "Brand DNA AI Fill";
const CONTRACT_PROMPT_NAME = "Decision Contract Suggest";

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

export interface BrandDnaInput {
  description: string;
  target_audience: string;
  communication_style: string;
  content_audience_loves: string;
}

export async function savePositioning(
  ideaId: string,
  opts: {
    status?: MktValidationStatus;
    /** Required when `status` changes — written to mkt_decision_log. */
    statusRationale?: string;
    positioning?: string | null;
    brandDna?: BrandDnaInput;
    referenceSources?: ReferenceSources;
    decisionContract?: DecisionContract;
    bookingUrl?: string | null;
  }
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  // Status changes are decisions — they require a rationale and get logged
  // with a metrics snapshot so the call can be audited later.
  let logVerdict: MktValidationStatus | null = null;
  if (opts.status !== undefined) {
    const { data: cur } = await ctx.supabase
      .from("mkt_validation" as never)
      .select("status")
      .eq("idea_id", ideaId)
      .maybeSingle();
    const currentStatus = (cur as { status: MktValidationStatus } | null)?.status;
    if (currentStatus && currentStatus !== opts.status) {
      if (!opts.statusRationale?.trim()) {
        return { error: "A rationale is required when changing the validation status." };
      }
      logVerdict = opts.status;
    }
  }

  const patch: Record<string, unknown> = {};
  if (opts.status !== undefined) patch.status = opts.status;
  if (opts.positioning !== undefined) patch.positioning = opts.positioning;
  if (opts.brandDna !== undefined) patch.icp_definition = opts.brandDna;
  if (opts.referenceSources !== undefined) patch.reference_sources = opts.referenceSources;
  if (opts.decisionContract !== undefined) patch.decision_contract = opts.decisionContract;
  if (opts.bookingUrl !== undefined) patch.booking_url = opts.bookingUrl?.trim() || null;

  const { error } = await ctx.supabase
    .from("mkt_validation" as never)
    .upsert({ idea_id: ideaId, ...patch } as never, { onConflict: "idea_id" });

  if (error) return { error: error.message };

  if (logVerdict) {
    const snapshot = await getFunnelMetrics(ideaId).catch(() => null);
    await ctx.supabase.from("mkt_decision_log" as never).insert({
      idea_id: ideaId,
      verdict: logVerdict,
      rationale: opts.statusRationale!.trim(),
      metrics_snapshot: snapshot ?? {},
      created_by: ctx.user.id,
    } as never);
  }

  revalidatePath(`/marketing/${ideaId}`);
  revalidatePath(`/marketing/${ideaId}/positioning`);
  return {};
}

// ── Decision Contract AI suggest ──────────────────────────────────────────────

/**
 * Suggests a pre-registered Decision Contract (riskiest assumption, thresholds,
 * review window) from the idea's positioning + brand DNA. Human reviews + saves.
 */
export async function suggestDecisionContract(
  ideaId: string
): Promise<{ error?: string; data?: DecisionContract }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const sb = createServiceClient();
  const { data: promptRow } = await sb
    .from("prompt")
    .select("description")
    .eq("name", CONTRACT_PROMPT_NAME)
    .maybeSingle();
  const template = (promptRow as { description: string } | null)?.description;
  if (!template) return { error: `Prompt "${CONTRACT_PROMPT_NAME}" not found in database.` };

  const [{ data: v }, { data: ideaRow }] = await Promise.all([
    ctx.supabase
      .from("mkt_validation" as never)
      .select("positioning, icp_definition, funnel_mode")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    ctx.supabase.from("idea").select("name").eq("id", ideaId).maybeSingle(),
  ]);

  const validation = v as {
    positioning: string | null;
    icp_definition: Record<string, string> | null;
    funnel_mode: string;
  } | null;
  const dna = validation?.icp_definition ?? {};

  let promptText = template;
  const vars: Record<string, string> = {
    idea_name: (ideaRow as { name: string | null } | null)?.name ?? "",
    positioning: validation?.positioning ?? "",
    description: dna.description ?? "",
    target_audience: dna.target_audience ?? "",
    funnel_mode: validation?.funnel_mode ?? "hybrid",
  };
  for (const [key, value] of Object.entries(vars)) {
    promptText = promptText.replaceAll(`{{${key}}}`, value || "(not specified)");
  }

  const res = await generateAiJsonResponse<DecisionContract>({
    service: cfg.service,
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt: promptText,
  });
  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI generation failed." };
  }
  return { data: res.data };
}

// ── AI auto-fill ──────────────────────────────────────────────────────────────

interface AiFillResult {
  description: string;
  target_audience: string;
  communication_style: string;
  content_audience_loves: string;
  positioning: string;
}

/**
 * Reads the "Brand DNA AI Fill" prompt from the Supabase prompt table,
 * substitutes {{variables}} from the idea's linked data, and
 * uses the AI dispatcher to generate Brand DNA + positioning.
 */
export async function aiAutoFill(
  ideaId: string
): Promise<{ error?: string; data?: AiFillResult }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  // 1. Load the prompt template from the DB (service-role to bypass RLS)
  const sb = createServiceClient();
  const { data: promptRow } = await sb
    .from("prompt")
    .select("description")
    .eq("name", BRAND_DNA_PROMPT_NAME)
    .maybeSingle();

  if (!promptRow || !(promptRow as { description: string }).description) {
    return { error: "Brand DNA prompt not found in database." };
  }
  let promptText = (promptRow as { description: string }).description;

  // 2. Load idea + its project name directly (we have ideaId, not projectId)
  const { data: ideaRow } = await ctx.supabase
    .from("idea")
    .select("id, name, description, project:project_id(name)")
    .eq("id", ideaId)
    .maybeSingle();

  type IdeaRow = {
    id: string;
    name: string | null;
    description: string | null;
    project: { name: string | null } | null;
  } | null;
  const idea = ideaRow as unknown as IdeaRow;
  const projectName = idea?.project?.name ?? idea?.name ?? "";

  let icpDescription = "";
  let icpGains = "";
  let icpPains = "";
  let brandVoice = "";
  let playbook = "";

  if (idea?.id) {
    const { data: icpData } = await ctx.supabase
      .from("idea_icp")
      .select("description, value_proposition_icp_gains, value_proposition_icp_pains")
      .eq("idea_id", idea.id)
      .maybeSingle();
    const icp = icpData as { description: string | null; value_proposition_icp_gains: string | null; value_proposition_icp_pains: string | null } | null;
    icpDescription = icp?.description ?? "";
    icpGains = icp?.value_proposition_icp_gains ?? "";
    icpPains = icp?.value_proposition_icp_pains ?? "";

    const { data: stylesData } = await ctx.supabase
      .from("idea_styles")
      .select("brand_voice")
      .eq("idea_id", idea.id)
      .maybeSingle();
    brandVoice = (stylesData as { brand_voice: string | null } | null)?.brand_voice ?? "";

    const { data: structureData } = await ctx.supabase
      .from("idea_structure_align" as never)
      .select("playbook_title, playbook_subtitle")
      .eq("idea_id" as never, idea.id)
      .maybeSingle();
    const s = structureData as { playbook_title: string | null; playbook_subtitle: string | null } | null;
    if (s?.playbook_title) playbook = `${s.playbook_title}. ${s.playbook_subtitle ?? ""}`.trim();
  }

  // 3. Substitute {{variable}} placeholders
  const vars: Record<string, string> = {
    project_name: projectName,
    idea_name: idea?.name ?? projectName,
    idea_description: idea?.description ?? "",
    icp_description: icpDescription,
    icp_gains: icpGains,
    icp_pains: icpPains,
    brand_voice: brandVoice,
    playbook: playbook,
  };
  for (const [key, value] of Object.entries(vars)) {
    promptText = promptText.replaceAll(`{{${key}}}`, value || "(not specified)");
  }

  // 4. Call AI
  const res = await generateAiJsonResponse<AiFillResult>({
    service: cfg.service,
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt: promptText,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI generation failed." };
  }
  return { data: res.data };
}
