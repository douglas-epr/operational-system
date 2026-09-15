import "server-only";

/**
 * Request-scoped identity lookup, shared by every auth gate.
 *
 * Every gate in this app (`requirePageAccess`, `requireChatUser`,
 * `requireInternalStaff`, `getUserIdOrError`, ...) used to run its own
 * `supabase.auth.getUser()` + `profiles.select("type")` pair. On a single
 * page render that calls several of these (or a server action that calls
 * more than one), that meant N round-trips to Supabase for the exact same
 * identity.
 *
 * `getCurrentUserWithRole` is wrapped in React `cache()`, which memoizes a
 * function call *for the lifetime of one request/render pass*. Every gate
 * below now calls this instead of hitting Supabase directly, so N callers
 * within one page render — or within one server action invocation — cost
 * exactly one `auth.getUser()` + one `profiles` round-trip.
 *
 * IMPORTANT: `cache()` de-dupes only within a single request. It is NOT a
 * cross-request cache — a new page load or a new server action invocation
 * is a fresh request and always re-fetches. This does not change
 * correctness (every request still authenticates itself), it only removes
 * the *duplicate* lookups that used to happen inside one request.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUserWithRole {
  userId: string;
  /** `profiles.type` for this user, or `null` if the profile row/type is missing. */
  role: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export const getCurrentUserWithRole = cache(
  async (): Promise<CurrentUserWithRole | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single();
    const role = (profile as { type?: string | null } | null)?.type ?? null;

    return { userId: user.id, role, supabase };
  }
);
