/**
 * Shared page-level access gate.
 *
 * Every page in `/app` that has a role restriction calls
 * `requirePageAccess(allowed)` at the top of its server component. The
 * helper:
 *
 *   1. Reads the current session via the server-side Supabase client.
 *   2. Redirects unauthenticated visitors to `/signin`.
 *   3. Loads the caller's `profiles.type` (the user role).
 *   4. If the role is in `allowed`, returns `{ supabase, user, role }`
 *      so the calling page can reuse the client without re-fetching.
 *   5. Otherwise calls `redirectForRole(role)` to send the user to the
 *      most appropriate landing page for their role.
 *
 * Centralising the redirect chain in one place makes it the single
 * source of truth: whenever the spec says "if user is `lead`, send them
 * to `/sandbox-planner`", that mapping lives only here. Every page that
 * imports `requirePageAccess` automatically inherits the up-to-date
 * mapping; tightening or relaxing the spec touches one file.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "admin"
  | "manager"
  | "operational"
  | "developer"
  | "client"
  | "qa"
  | "referrer"
  | "lead";

/**
 * Map from role → the page they should land on if they hit a page they're
 * not allowed to see. The order roughly mirrors the sidebar — every role
 * has at least one page they can always reach.
 */
const ROLE_FALLBACK: Record<UserRole, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  operational: "/internal-projects",
  developer: "/projects",
  client: "/projects",
  qa: "/projects",
  referrer: "/recommended-projects",
  lead: "/sandbox-planner",
};

/**
 * Send the caller to the right "home" for their role. Used by gated
 * pages when a non-allowed role lands on them.
 */
export function redirectForRole(role: string | null | undefined): never {
  if (role && role in ROLE_FALLBACK) {
    redirect(ROLE_FALLBACK[role as UserRole]);
  }
  // Unknown role → send to /signin so they re-auth.
  redirect("/signin");
}

interface PageAccess {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: UserRole;
}

/**
 * Gate a server component to a specific set of roles. Throws (via
 * `redirect`) when the caller is unauthenticated or their role isn't
 * in `allowed`.
 *
 * Usage:
 *   const { supabase, userId, role } = await requirePageAccess(["admin","manager"]);
 *
 * Pass `allowAll: true` to skip the role check (use for pages that just
 * need an authenticated user, e.g. `/feedback`). Pass `denyRoles` to
 * blocklist instead of allowlist (use for `/settings` which allows
 * everyone except referrer).
 */
export async function requirePageAccess(
  allowed: UserRole[] | { allowAll: true } | { denyRoles: UserRole[] }
): Promise<PageAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const role = (profile as { type?: string | null } | null)?.type as UserRole | null;
  if (!role) redirect("/signin");

  // Allowlist
  if (Array.isArray(allowed)) {
    if (!allowed.includes(role)) redirectForRole(role);
    return { supabase, userId: user.id, role };
  }
  // Blocklist
  if ("denyRoles" in allowed) {
    if (allowed.denyRoles.includes(role)) redirectForRole(role);
    return { supabase, userId: user.id, role };
  }
  // allowAll
  return { supabase, userId: user.id, role };
}
