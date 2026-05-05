/**
 * Server Actions for Prompts management page.
 * Admin/manager only: CRUD for prompt groups and prompt content.
 *
 * prompt_group schema: id, name, created_at, updated_at
 * prompt schema:       id, name, description, group (FK → prompt_group.id),
 *                      type (internal — used by AI routing, not shown in UI),
 *                      created_at, updated_at
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PATH = "/prompts";

export interface PromptRow {
  id: string;
  name: string | null;
  description: string | null;
  group: number;
  created_at: string;
  updated_at: string | null;
}

export interface PromptGroupRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
  prompts: PromptRow[];
}

/** Fetch all prompt groups with their prompts. Admin/manager only. */
export async function getPromptGroups(): Promise<{ data?: PromptGroupRow[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Role check — service client bypasses RLS; gate it explicitly
  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    return { error: "Insufficient permissions." };
  }

  const serviceClient = createServiceClient();

  const [groupsRes, promptsRes] = await Promise.all([
    serviceClient
      .from("prompt_group" as never)
      .select("id, name, created_at, updated_at")
      .order("id"),
    serviceClient
      .from("prompt" as never)
      .select("id, name, description, group, created_at, updated_at")
      .order("created_at"),
  ]);

  if (groupsRes.error) return { error: groupsRes.error.message };
  if (promptsRes.error) return { error: promptsRes.error.message };

  const rawGroups = (groupsRes.data ?? []) as unknown as {
    id: number;
    name: string;
    created_at: string;
    updated_at: string | null;
  }[];

  const rawPrompts = (promptsRes.data ?? []) as unknown as PromptRow[];

  const promptsByGroup = new Map<number, PromptRow[]>();
  for (const p of rawPrompts) {
    const list = promptsByGroup.get(p.group) ?? [];
    list.push(p);
    promptsByGroup.set(p.group, list);
  }

  const result: PromptGroupRow[] = rawGroups.map((g) => ({
    id: g.id,
    name: g.name,
    created_at: g.created_at,
    updated_at: g.updated_at,
    prompts: promptsByGroup.get(g.id) ?? [],
  }));

  return { data: result };
}

/** Update a prompt's name. Admin/manager only. */
export async function updatePromptName(
  id: string,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    return { error: "Unauthorized" };
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("prompt" as never)
    .update({ name } as never)
    .eq("id" as never, id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}

/** Update a prompt's description content. Admin/manager only. */
export async function updatePromptDescription(
  id: string,
  description: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    return { error: "Unauthorized" };
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("prompt" as never)
    .update({ description } as never)
    .eq("id" as never, id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}

/** Update the name of a prompt group. Admin/manager only. */
export async function updatePromptGroupName(
  id: number,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    return { error: "Unauthorized" };
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("prompt_group" as never)
    .update({ name } as never)
    .eq("id" as never, id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}
