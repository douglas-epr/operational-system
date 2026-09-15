"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";

// ── Create SOP ─────────────────────────────────────────────────────────────────

export async function createSop(data: {
  name: string;
  tag_ids: string[];
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
      authorized_users: data.authorized_users,
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
): Promise<{ error?: string; version?: { id: string; version_name: string; created_at: string; created_by: string } }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Count existing versions to compute next version number
  const { count } = await supabase
    .from("sop_version")
    .select("id", { count: "exact", head: true })
    .eq("sop_id", sopId);

  const versionName = `Version ${(count ?? 0) + 1}`;

  const { data: version, error } = await supabase
    .from("sop_version")
    .insert({
      sop_id: sopId,
      version_name: versionName,
      content,
      created_by: user.id,
    })
    .select("id, version_name, created_at, created_by")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/sops");
  return { version: version as { id: string; version_name: string; created_at: string; created_by: string } };
}

// ── Rename version ────────────────────────────────────────────────────────────

export async function renameVersion(versionId: string, name: string): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { error } = await supabase
    .from("sop_version")
    .update({ version_name: name.trim() })
    .eq("id", versionId);
  if (error) return { error: error.message };
  revalidatePath("/sops");
  return {};
}

// ── Delete version ────────────────────────────────────────────────────────────

export async function deleteVersion(versionId: string): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
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
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
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
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
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
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { error } = await supabase.from("sop_tag").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sops");
  return {};
}
