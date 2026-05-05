"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserType } from "@/types/projects";

// ── Create SOP ─────────────────────────────────────────────────────────────────

export async function createSop(data: {
  name: string;
  tag_ids: string[];
  authorized_user_types: UserType[];
  authorized_users: string[];
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get max order
  const { data: existing } = await supabase.from("sop").select("order");
  const maxOrder = Math.max(0, ...((existing ?? []).map((s) => s.order ?? 0)));

  const { data: sop, error } = await supabase
    .from("sop")
    .insert({
      name: data.name,
      order: maxOrder + 1,
      authorized_user_types: data.authorized_user_types,
      authorized_users: data.authorized_users,
      tags: data.tag_ids,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Create initial version
  await supabase.from("sop_version").insert({
    sop_id: sop.id,
    version_name: "Version 1",
    content: "",
    authorized_user_types: data.authorized_user_types,
    authorized_users: data.authorized_users,
    created_by: user.id,
  });

  revalidatePath("/sops");
  return { id: sop.id };
}

// ── Update SOP ─────────────────────────────────────────────────────────────────

export async function updateSop(
  id: string,
  data: {
    name: string;
    tag_ids: string[];
    authorized_user_types: UserType[];
    authorized_users: string[];
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("sop")
    .update({
      name: data.name,
      authorized_user_types: data.authorized_user_types,
      authorized_users: data.authorized_users,
      // Tags now live as a UUID[] array — replace in one shot, no
      // separate join-table sync needed.
      tags: data.tag_ids,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/sops");
  return {};
}

// ── Delete SOP ─────────────────────────────────────────────────────────────────

export async function deleteSop(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("sop").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sops");
  return {};
}

// ── Save as new version ────────────────────────────────────────────────────────

export async function saveAsNewVersion(
  sopId: string,
  content: string
): Promise<{ error?: string; version?: { id: string; version_name: string; created_at: string } }> {
  const supabase = await createClient();

  // Count existing versions to compute next version number
  const { count } = await supabase
    .from("sop_version")
    .select("id", { count: "exact", head: true })
    .eq("sop_id", sopId);

  const { data: sop } = await supabase
    .from("sop")
    .select("authorized_user_types, authorized_users")
    .eq("id", sopId)
    .single();

  const versionName = `Version ${(count ?? 0) + 1}`;

  const { data: version, error } = await supabase
    .from("sop_version")
    .insert({
      sop_id: sopId,
      version_name: versionName,
      content,
      authorized_user_types: sop?.authorized_user_types ?? [],
      authorized_users: sop?.authorized_users ?? [],
    })
    .select("id, version_name, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/sops");
  return { version };
}

// ── Delete version ────────────────────────────────────────────────────────────

export async function deleteVersion(versionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sop_version").delete().eq("id", versionId);
  if (error) return { error: error.message };
  revalidatePath("/sops");
  return {};
}

// ── Update current version ─────────────────────────────────────────────────────

export async function updateVersion(
  versionId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sop_version")
    .update({ content })
    .eq("id", versionId);

  if (error) return { error: error.message };
  revalidatePath("/sops");
  return {};
}

// ── Create tag ─────────────────────────────────────────────────────────────────

export async function createTag(name: string): Promise<{ error?: string; tag?: { id: string; name: string } }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sop_tag")
    .insert({ name: name.trim() })
    .select("id, name")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/sops");
  return { tag: data };
}

// ── Delete tag ─────────────────────────────────────────────────────────────────

export async function deleteTag(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sop_tag").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sops");
  return {};
}
