"use server";

/**
 * Server actions for /talent-pool.
 *
 * Auth/role gate: admin, manager, operational only (matches Bubble's
 * Talent Pool page restrictions per docs/reference_docs/paginas.md).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  TalentInput,
  RecommenderInput,
  ClientInput,
  CompanyInput,
} from "@/types/talent";

const STAFF = ["admin", "manager", "operational"] as const;

async function getStaffClient() {
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
  return { supabase, userId: user.id };
}

// ─── Talent CRUD ────────────────────────────────────────────────────────────

export async function createTalent(
  input: TalentInput
): Promise<{ error?: string; id?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  if (!input.name?.trim()) return { error: "Full name is required." };

  const { data: row, error } = await supabase
    .from("talent")
    .insert({
      name:                 input.name.trim(),
      email:                input.email,
      phone:                input.phone,
      linkedin:             input.linkedin,
      portfolio:            input.portfolio,
      picture:              input.picture,
      country:              input.country,
      current_job_position: input.current_job_position,
      level:                input.level,
      authority_level:      input.authority_level,
      current_company_id:   input.current_company_id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await replaceTalentChildren(supabase, row.id, input);
  revalidatePath("/talent-pool");
  return { id: row.id };
}

export async function updateTalent(
  id: string,
  input: Partial<TalentInput>
): Promise<{ error?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const patch: Record<string, unknown> = {};
  for (const k of [
    "name","email","phone","linkedin","portfolio","picture","country",
    "current_job_position","level","authority_level","current_company_id",
  ] as const) {
    if (k in input) patch[k] = input[k];
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("talent").update(patch).eq("id", id);
    if (error) return { error: error.message };
  }

  await replaceTalentChildren(supabase, id, input);
  revalidatePath("/talent-pool");
  return {};
}

export async function deleteTalent(id: string): Promise<{ error?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { error } = await supabase.from("talent").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/talent-pool");
  return {};
}

// ─── Helper: replace tools / languages / referrers / client referrers ──────

async function replaceTalentChildren(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  talentId: string,
  input: Partial<TalentInput>
) {
  if (input.tools) {
    await supabase.from("talent_tool").delete().eq("talent_id", talentId);
    if (input.tools.length) {
      await supabase.from("talent_tool").insert(
        input.tools.map((t) => ({
          talent_id: talentId,
          tool: t.tool,
          score: t.score,
        }))
      );
    }
  }

  if (input.programming_languages) {
    await supabase
      .from("talent_programming_language")
      .delete()
      .eq("talent_id", talentId);
    if (input.programming_languages.length) {
      await supabase.from("talent_programming_language").insert(
        input.programming_languages.map((l) => ({
          talent_id: talentId,
          programming_language: l.language,
          score: l.score,
        }))
      );
    }
  }

  if (input.recommender_ids) {
    await supabase
      .from("talent_referred_by")
      .delete()
      .eq("talent_id", talentId);
    if (input.recommender_ids.length) {
      await supabase.from("talent_referred_by").insert(
        input.recommender_ids.map((rid) => ({
          talent_id: talentId,
          referred_by_id: rid,
        }))
      );
    }
  }

  if (input.client_referrer_ids) {
    await supabase
      .from("client_who_referred_this_talent")
      .delete()
      .eq("talent_id", talentId);
    if (input.client_referrer_ids.length) {
      await supabase.from("client_who_referred_this_talent").insert(
        input.client_referrer_ids.map((cid) => ({
          talent_id: talentId,
          client_id: cid,
        }))
      );
    }
  }
}

// ─── Search (typeahead) ─────────────────────────────────────────────────────

export async function searchTalents(
  query: string,
  limit = 10
): Promise<{ id: string; name: string | null; picture: string | null }[]> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return [];
  const q = query.trim();
  if (!q) return [];
  const { data } = await ctx.supabase
    .from("talent")
    .select("id, name, picture")
    .ilike("name", `%${q}%`)
    .limit(limit);
  return (data ?? []) as { id: string; name: string | null; picture: string | null }[];
}

export async function searchClientsAction(
  query: string,
  limit = 10
): Promise<{ id: string; name: string | null; picture: string | null }[]> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return [];
  const q = query.trim();
  if (!q) return [];
  const { data } = await ctx.supabase
    .from("client")
    .select("id, name, picture")
    .ilike("name", `%${q}%`)
    .limit(limit);
  return (data ?? []) as { id: string; name: string | null; picture: string | null }[];
}

export async function searchCompaniesAction(
  query: string,
  limit = 10
): Promise<{ id: string; name: string }[]> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return [];
  const q = query.trim();
  if (!q) return [];
  const { data } = await ctx.supabase
    .from("company")
    .select("id, name")
    .ilike("name", `%${q}%`)
    .limit(limit);
  return (data ?? []) as { id: string; name: string }[];
}

// ─── Company / Recommender / Client creation ───────────────────────────────

export async function createCompanyAction(
  input: CompanyInput
): Promise<{ error?: string; company?: { id: string; name: string } }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  if (!input.name?.trim()) return { error: "Name is required." };

  const { data: row, error } = await ctx.supabase
    .from("company")
    .insert({ name: input.name.trim(), website: input.website ?? null })
    .select("id, name")
    .single();
  if (error) return { error: error.message };
  return { company: { id: row.id, name: row.name as string } };
}

export async function createClientProfile(
  input: ClientInput
): Promise<{ error?: string; client?: { id: string; name: string | null; picture: string | null } }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  if (!input.name?.trim()) return { error: "Full name is required." };

  const { data: row, error } = await ctx.supabase
    .from("client")
    .insert({
      name:     input.name.trim(),
      country:  input.country,
      email:    input.email,
      phone:    input.phone,
      linkedin: input.linkedin,
      picture:  input.picture,
    })
    .select("id, name, picture")
    .single();
  if (error) return { error: error.message };
  return {
    client: {
      id: row.id,
      name: row.name as string | null,
      picture: row.picture as string | null,
    },
  };
}

export async function createRecommender(
  input: RecommenderInput
): Promise<{ error?: string; recommender?: { id: string; name: string | null; picture: string | null } }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  if (!input.name?.trim()) return { error: "Full name is required." };

  const { data: row, error } = await ctx.supabase
    .from("talent")
    .insert({
      name:                 input.name.trim(),
      email:                input.email,
      phone:                input.phone,
      linkedin:             input.linkedin,
      portfolio:            input.portfolio,
      picture:              input.picture,
      country:              input.country,
      current_job_position: input.current_job_position,
      level:                input.level,
      authority_level:      input.authority_level,
      current_company_id:   input.current_company_id,
    })
    .select("id, name, picture")
    .single();
  if (error) return { error: error.message };
  return {
    recommender: {
      id: row.id,
      name: row.name as string | null,
      picture: row.picture as string | null,
    },
  };
}

// ─── Share link ─────────────────────────────────────────────────────────────

const SHARE_HOURS = 4;

export async function generateShareLink(
  talentId: string
): Promise<{ error?: string; code?: string; expiresAt?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const code = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SHARE_HOURS * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("talent")
    .update({ code, code_expires_at: expiresAt })
    .eq("id", talentId);
  if (error) return { error: error.message };

  revalidatePath("/talent-pool");
  return { code, expiresAt };
}
