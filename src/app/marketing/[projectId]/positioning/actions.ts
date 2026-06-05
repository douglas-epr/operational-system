"use server";

/**
 * Positioning page actions — save validation settings (decision + positioning)
 * + brand DNA (stored in mkt_validation.icp_definition JSONB).
 *
 * AI auto-fill reads the prompt from the Supabase `prompt` table
 * (group = Marketing / id 15, name = "Brand DNA AI Fill") and uses
 * {{variable}} substitution from the project's linked Sandbox idea data.
 *
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import type { MktValidationStatus, ReferenceSources } from "@/types/marketing";

const STAFF = ["admin", "manager"] as const;
const BRAND_DNA_PROMPT_NAME = "Brand DNA AI Fill";

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
  projectId: string,
  opts: {
    status?: MktValidationStatus;
    positioning?: string | null;
    brandDna?: BrandDnaInput;
    referenceSources?: ReferenceSources;
  }
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const patch: Record<string, unknown> = {};
  if (opts.status !== undefined) patch.status = opts.status;
  if (opts.positioning !== undefined) patch.positioning = opts.positioning;
  if (opts.brandDna !== undefined) patch.icp_definition = opts.brandDna;
  if (opts.referenceSources !== undefined) patch.reference_sources = opts.referenceSources;

  const { error } = await ctx.supabase
    .from("mkt_validation" as never)
    .update(patch as never)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/marketing/${projectId}`);
  revalidatePath(`/marketing/${projectId}/positioning`);
  return {};
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
 * substitutes {{variables}} from the project's linked Sandbox idea, and
 * uses the AI dispatcher to generate Brand DNA + positioning.
 */
export async function aiAutoFill(
  projectId: string
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

  // 2. Collect variable values from project + linked idea
  const { data: project } = await ctx.supabase
    .from("project")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();
  const projectName = (project as { name: string | null } | null)?.name ?? "";

  const { data: ideaRow } = await ctx.supabase
    .from("idea")
    .select("id, name, description")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  type IdeaRow = { id: string; name: string | null; description: string | null } | null;
  const idea = ideaRow as IdeaRow;

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
