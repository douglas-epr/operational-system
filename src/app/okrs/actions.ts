"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  InternalGoal,
  InternalGoalStatus,
  InternalKeyResult,
  InternalKeyResultStatus,
  InternalKeyResultTrack,
} from "@/types/okrs";

const INTERNAL_TYPES = ["admin", "manager", "operational"] as const;

async function requireInternalStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    !profile.type ||
    !(INTERNAL_TYPES as readonly string[]).includes(profile.type)
  ) {
    return { error: "Forbidden" as const };
  }
  return { supabase, userId: user.id };
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function createGoal(
  name: string
): Promise<{ goalId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const { data: existing } = await supabase.from("internal_goal").select("order");
  const maxOrder = Math.max(0, ...((existing ?? []).map((g: any) => g.order ?? 0)));

  const { data, error } = await supabase
    .from("internal_goal")
    .insert({
      name: name.trim() || "Untitled goal",
      order: maxOrder + 1,
      status: "not_started" satisfies InternalGoalStatus,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return { goalId: data.id };
}

export async function updateGoal(
  id: string,
  patch: Partial<
    Pick<InternalGoal, "name" | "status" | "description" | "order">
  >
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_goal")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return {};
}

export async function deleteGoal(id: string): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase.from("internal_goal").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return {};
}

// ── Key Results ───────────────────────────────────────────────────────────────

export async function createKeyResult(
  goalId: string,
  name: string
): Promise<{ krId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const { data: siblings } = await supabase
    .from("internal_key_result")
    .select("order")
    .eq("internal_goal_id", goalId);
  const maxOrder = Math.max(
    0,
    ...((siblings ?? []).map((k: any) => k.order ?? 0))
  );

  const { data, error } = await supabase
    .from("internal_key_result")
    .insert({
      internal_goal_id: goalId,
      name: name.trim() || "Untitled key result",
      order: maxOrder + 1,
      status: "not_started" satisfies InternalKeyResultStatus,
      achieved: false,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return { krId: data.id };
}

export async function updateKeyResult(
  id: string,
  patch: Partial<
    Pick<
      InternalKeyResult,
      | "name"
      | "internal_goal_id"
      | "status"
      | "start_date"
      | "end_date"
      | "current_key_result_value"
      | "achieved"
      | "description"
      | "order"
    >
  >
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_key_result")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return {};
}

export async function deleteKeyResult(id: string): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_key_result")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return {};
}

// ── Tracker entries ───────────────────────────────────────────────────────────

export async function createTrackEntry(
  goalId: string,
  krId: string,
  entry: {
    date: string;
    value: number | null;
    current_target_key_result_value: number | null;
    achieved: boolean;
  }
): Promise<{ trackId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const { data, error } = await supabase
    .from("internal_key_result_track")
    .insert({
      internal_goal_id: goalId,
      internal_key_result_id: krId,
      date: entry.date,
      value: entry.value,
      current_target_key_result_value: entry.current_target_key_result_value,
      achieved: entry.achieved,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return { trackId: data.id };
}

export async function updateTrackEntry(
  id: string,
  patch: Partial<
    Pick<
      InternalKeyResultTrack,
      "date" | "value" | "current_target_key_result_value" | "achieved"
    >
  >
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_key_result_track")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return {};
}

export async function deleteTrackEntry(
  id: string
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_key_result_track")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/okrs");
  return {};
}
