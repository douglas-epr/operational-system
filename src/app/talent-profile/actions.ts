"use server";

/**
 * Public server actions for /talent-profile?code=<token>.
 *
 * These power the unauthenticated self-edit flow. The talent page is
 * accessible to anyone holding a valid 4-hour share code; the SECURITY
 * DEFINER RPCs `get_talent_by_code` / `update_talent_by_code` enforce
 * token validity inside the database (see migration
 * 20260426000010_talent_pool_share_and_operational_rls.sql).
 *
 * We use the service-role client only because RLS would otherwise block
 * anon callers entirely from invoking the RPC. The RPCs themselves are
 * the only surface exposed and they validate `code_expires_at > NOW()`.
 */

import { createServiceClient } from "@/lib/supabase/server";

export type TalentByCode = {
  id: string;
  code: string | null;
  code_expires_at: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  picture: string | null;
  portfolio: string | null;
  country: string | null;
  current_job_position: string | null;
  level: string | null;
  authority_level: string | null;
  current_company_id: string | null;
  tools: { tool: string; score: number | null }[];
  programming_languages: { language: string; score: number | null }[];
  recommender_ids: string[];
  client_referrer_ids: string[];
  current_company: { id: string; name: string; website: string | null } | null;
};

export async function getTalentByCode(
  code: string
): Promise<TalentByCode | null> {
  if (!code) return null;
  const sb = createServiceClient();
  const { data, error } = await sb.rpc("get_talent_by_code", { p_code: code });
  if (error || !data) return null;
  return data as unknown as TalentByCode;
}

export async function updateTalentByCode(
  code: string,
  payload: Record<string, unknown>
): Promise<{ error?: string; id?: string }> {
  if (!code) return { error: "Missing share code." };
  const sb = createServiceClient();
  const { data, error } = await sb.rpc("update_talent_by_code", {
    p_code: code,
    // RPC accepts a JSONB blob; the cast keeps TS happy without forcing
    // every caller to cast their domain object to `Json`.
    p_payload: payload as unknown as never,
  });
  if (error) return { error: error.message };
  const result = (data ?? {}) as { error?: string; id?: string };
  if (result.error) return { error: result.error };
  return { id: result.id };
}

/**
 * Upload an avatar via the share-link flow.
 *
 * Re-checks the code is still valid before touching storage, then writes
 * to the public `talent-avatars` bucket using the service-role client
 * (anon callers can't write to the bucket directly). Returns the public
 * URL — caller is expected to persist it via `updateTalentByCode`.
 */
export async function uploadTalentAvatarByCode(
  code: string,
  file: { name: string; type: string; bytesBase64: string }
): Promise<{ error?: string; url?: string }> {
  const talent = await getTalentByCode(code);
  if (!talent) return { error: "Link is invalid or has expired." };

  const sb = createServiceClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${code}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(file.bytesBase64, "base64");

  const { error: upErr } = await sb.storage
    .from("talent-avatars")
    .upload(path, buffer, {
      contentType: file.type || "image/png",
      upsert: false,
    });
  if (upErr) return { error: upErr.message };

  const { data } = sb.storage.from("talent-avatars").getPublicUrl(path);
  return { url: data.publicUrl };
}
