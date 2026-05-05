"use server";

/**
 * Server actions for /leads — CRUD on the `client` table.
 *
 * Auth gate: admin / manager / operational. Matches the `client: staff all`
 * RLS policy, but checked here too to fail fast and return a clean error.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadInput } from "@/types/leads";

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
  return { supabase };
}

export async function listLeads(): Promise<Lead[]> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return [];

  const { data, error } = await ctx.supabase
    .from("client")
    .select("id, name, email, phone, linkedin, picture, country, created_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Lead[];
}

export async function createLead(
  input: LeadInput
): Promise<{ error?: string; id?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };

  if (!input.name?.trim()) return { error: "Full name is required." };

  const { data, error } = await ctx.supabase
    .from("client")
    .insert({
      name:     input.name.trim(),
      email:    input.email?.trim() || null,
      phone:    input.phone?.trim() || null,
      linkedin: input.linkedin?.trim() || null,
      picture:  input.picture,
      country:  input.country,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { id: data.id };
}

export async function updateLead(
  id: string,
  input: Partial<LeadInput>
): Promise<{ error?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined)     patch.name     = input.name.trim() || null;
  if (input.email !== undefined)    patch.email    = input.email?.trim() || null;
  if (input.phone !== undefined)    patch.phone    = input.phone?.trim() || null;
  if (input.linkedin !== undefined) patch.linkedin = input.linkedin?.trim() || null;
  if (input.picture !== undefined)  patch.picture  = input.picture;
  if (input.country !== undefined)  patch.country  = input.country;

  const { error } = await ctx.supabase.from("client").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  return {};
}

export async function deleteLead(id: string): Promise<{ error?: string }> {
  const ctx = await getStaffClient();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase.from("client").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  return {};
}
