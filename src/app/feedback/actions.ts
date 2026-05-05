"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackInput } from "@/types/feedback";
import type { UserType } from "@/types/projects";

/**
 * Create a feedback row on behalf of the signed-in user.
 * The user's type is stamped server-side so the wall can be filtered by it.
 */
export async function createFeedback(
  data: FeedbackInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const userType = (profile?.type ?? null) as UserType | null;

  const { data: row, error } = await supabase
    .from("feedback")
    .insert({
      project_id: data.project_id,
      comment:    data.comment,
      rating:     data.rating,
      user_type:  userType,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/feedback");
  return { id: row.id };
}

export async function updateFeedback(
  id: string,
  data: Partial<FeedbackInput>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const { error } = await supabase
    .from("feedback")
    .update({
      project_id: data.project_id,
      comment:    data.comment,
      rating:     data.rating,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/feedback");
  return {};
}

export async function deleteFeedback(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/feedback");
  return {};
}
