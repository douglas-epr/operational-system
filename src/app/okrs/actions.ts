"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import type {
  InternalGoal,
  InternalGoalStatus,
  InternalKeyResult,
  InternalKeyResultStatus,
  InternalKeyResultTrack,
} from "@/types/okrs";

const INTERNAL_TYPES = ["admin", "manager", "operational"] as const;

async function requireInternalStaff() {
  // Request-scoped, React-cache()-wrapped lookup — see current-user.ts.
  // De-dupes the getUser()+profiles round-trip with any other gate called
  // in this same request.
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" as const };
  const { supabase, userId, role } = current;
  if (!role || !(INTERNAL_TYPES as readonly string[]).includes(role)) {
    return { error: "Forbidden" as const };
  }
  return { supabase, userId };
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function createGoal(
  name: string
): Promise<{ goalId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const { data: last } = await supabase
    .from("internal_goal")
    .select("order")
    .order("order", { ascending: false })
    .limit(1);
  const maxOrder = last?.[0]?.order ?? 0;

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

  const { data: last } = await supabase
    .from("internal_key_result")
    .select("order")
    .eq("internal_goal_id", goalId)
    .order("order", { ascending: false })
    .limit(1);
  const maxOrder = last?.[0]?.order ?? 0;

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
