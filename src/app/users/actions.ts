"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { UserType } from "@/types/projects";

// ── Auth guard ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();

  if (profile?.type !== "admin") {
    return { error: "Insufficient permissions." };
  }
  return { error: null };
}

// ── Create user ────────────────────────────────────────────────────────────────

export async function createUser(data: {
  first_name: string;
  last_name: string;
  email: string;
  type: UserType;
  country: string;
  picture: string;
}): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if (guard.error) return { error: guard.error };

  const admin = createServiceClient();

  // 1. Create auth user
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    password: crypto.randomUUID(), // temporary — user will reset via email
    user_metadata: { first_name: data.first_name, last_name: data.last_name },
  });
  if (createError) return { error: createError.message };

  // 2. Upsert profile
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      type: data.type,
      country: data.country || null,
      picture: data.picture || null,
    });
  if (profileError) return { error: profileError.message };

  // 3. Send invitation (password reset) email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await admin.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${appUrl}/reset_pw`,
  });

  revalidatePath("/users");
  return {};
}

// ── Update user ────────────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  data: {
    first_name: string;
    last_name: string;
    type: UserType;
    country: string;
    picture: string;
  }
): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if (guard.error) return { error: guard.error };

  const admin = createServiceClient();
  const { error } = await admin
    .from("profiles")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      type: data.type,
      country: data.country || null,
      picture: data.picture || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/users");
  return {};
}

// ── Delete user ────────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if (guard.error) return { error: guard.error };

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/users");
  return {};
}

// ── Resend invitation ──────────────────────────────────────────────────────────

export async function resendInvitation(email: string): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if (guard.error) return { error: guard.error };

  const admin = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset_pw`,
  });

  if (error) return { error: error.message };
  return {};
}
