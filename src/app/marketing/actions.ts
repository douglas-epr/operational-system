"use server";

/**
 * Server actions for /marketing — the Marketing Validation Engine admin zone.
 *
 * Lists ideas with their validation config. Marketing analysis is now
 * idea-based (not project-based). Auth gate: admin / manager.
 * `mkt_*` tables use the established `as never` cast pattern.
 */

import { createClient } from "@/lib/supabase/server";
import type { MktIdeaListItem, MktValidation } from "@/types/marketing";

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

/** List every idea with its validation config (null if not yet started). */
export async function listIdeasWithValidation(): Promise<MktIdeaListItem[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];

  const [{ data: ideas }, { data: validations }] = await Promise.all([
    ctx.supabase
      .from("idea")
      .select("id, name, version_name, description, project_id, project:project_id(id, name)")
      .order("created_at", { ascending: false }),
    ctx.supabase.from("mkt_validation" as never).select("*"),
  ]);

  type IdeaRow = {
    id: string;
    name: string | null;
    version_name: string | null;
    description: string | null;
    project_id: string | null;
    project: { id: string; name: string | null } | null;
  };

  const vByIdea = new Map<string, MktValidation>();
  for (const v of (validations ?? []) as unknown as MktValidation[]) {
    vByIdea.set(v.idea_id, v);
  }

  return ((ideas ?? []) as unknown as IdeaRow[]).map((i) => ({
    idea_id: i.id,
    idea_name: i.name,
    idea_version_name: i.version_name,
    idea_description: i.description,
    project_id: i.project_id,
    project_name: (i.project as { name: string | null } | null)?.name ?? null,
    validation: vByIdea.get(i.id) ?? null,
  }));
}
