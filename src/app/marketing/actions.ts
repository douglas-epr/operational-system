"use server";

/**
 * Server actions for /marketing — the Marketing Validation Engine admin zone.
 *
 * Phase 0 scope: list existing projects with their validation config, and
 * enable/update a project's validation (creates the 1:1 `mkt_validation` row).
 *
 * Auth gate: admin / manager (matches the sidebar entry and page gate).
 * `mkt_*` tables aren't in the generated Supabase types yet, so we use the
 * established `as never` cast pattern (see sandbox-planner actions).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  MktFunnelMode,
  MktProjectListItem,
  MktValidation,
  MktValidationStatus,
} from "@/types/marketing";

const PATH = "/marketing";
const STAFF = ["admin", "manager"] as const;

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();

  if (!STAFF.includes((profile?.type ?? "") as (typeof STAFF)[number])) {
    return { error: "Forbidden." as const };
  }
  return { supabase, user };
}

/** List every project with its validation config (null if not yet enabled). */
export async function listProjectsWithValidation(): Promise<MktProjectListItem[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];

  const [{ data: projects }, { data: validations }] = await Promise.all([
    ctx.supabase.from("project").select("id, name").order("name", { ascending: true }),
    ctx.supabase.from("mkt_validation" as never).select("*"),
  ]);

  const vByProject = new Map<string, MktValidation>();
  for (const v of (validations ?? []) as unknown as MktValidation[]) {
    vByProject.set(v.project_id, v);
  }

  return ((projects ?? []) as { id: string; name: string | null }[]).map((p) => ({
    project_id: p.id,
    project_name: p.name,
    validation: vByProject.get(p.id) ?? null,
  }));
}

/** Fetch one project's validation config. */
export async function getValidation(
  projectId: string
): Promise<MktValidation | null> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return null;

  const { data } = await ctx.supabase
    .from("mkt_validation" as never)
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  return (data as unknown as MktValidation) ?? null;
}

/** Enable validation for a project — creates the 1:1 mkt_validation row. */
export async function enableValidation(
  projectId: string,
  funnelMode: MktFunnelMode = "b2b_outreach"
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  if (!projectId) return { error: "Project is required." };

  const { data, error } = await ctx.supabase
    .from("mkt_validation" as never)
    .upsert(
      {
        project_id: projectId,
        funnel_mode: funnelMode,
        created_by: ctx.user.id,
      } as never,
      { onConflict: "project_id" }
    )
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(PATH);
  return { id: (data as unknown as { id: string }).id };
}

/** Update a project's validation config (mode, status, positioning, stages). */
export async function updateValidation(
  projectId: string,
  patch: {
    funnel_mode?: MktFunnelMode;
    status?: MktValidationStatus;
    positioning?: string | null;
    enabled_capture_stages?: string[];
    icp_definition?: Record<string, unknown>;
  }
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("mkt_validation" as never)
    .update(patch as never)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(PATH);
  revalidatePath(`${PATH}/${projectId}`);
  return {};
}
