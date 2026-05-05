"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(data: {
  first_name: string;
  last_name: string;
  country: string;
  picture: string;
  signature?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const patch: Record<string, unknown> = {
    first_name: data.first_name || null,
    last_name:  data.last_name  || null,
    country:    data.country    || null,
    picture:    data.picture    || null,
  };
  if (data.signature !== undefined) patch.signature = data.signature || null;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}
