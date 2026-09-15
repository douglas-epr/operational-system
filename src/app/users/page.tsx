import { createServiceClient } from "@/lib/supabase/server";
import { requirePageAccess } from "@/lib/auth/page-gate";
import type { UserRow, UserType } from "@/types/projects";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import UsersList from "./_components/UsersList";

// Matches auth.admin.listUsers's perPage below. Not pagination — just a cap
// so this page can't outrun the admin API page size. Real pagination for
// both the profiles list and the auth admin listing is a follow-up if the
// user count ever approaches this number.
const USERS_LIMIT = 1000;

export default async function UsersPage() {
  // Gate: admin only. Other roles (incl. manager) get role-specific
  // redirects via the shared helper (manager → /dashboard, operational →
  // /internal-projects, dev/client/qa → /projects, lead → /ideas-refiner).
  const { supabase, userId } = await requirePageAccess(["admin"]);

  // Fetch current user profile (for the Sidebar avatar/name).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  // Fetch all profiles
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, country, created_at")
    .order("created_at", { ascending: true })
    .limit(USERS_LIMIT);

  // Fetch all auth users to get emails (requires service role)
  const admin = createServiceClient();
  const { data: authData } = await admin.auth.admin.listUsers({
    perPage: USERS_LIMIT,
  });
  const emailMap = new Map<string, string>(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  // Merge profiles with emails
  const users: UserRow[] = (profilesData ?? []).map((p) => ({
    id:         p.id,
    first_name: p.first_name,
    last_name:  p.last_name,
    picture:    p.picture,
    type:       (p.type ?? null) as UserType | null,
    country:    p.country ?? null,
    created_at: p.created_at,
    email:      emailMap.get(p.id) ?? "",
  }));

  return (
    <PageShell profile={profile} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader
          title="Users"
          subtitle={`${users.length} user${users.length !== 1 ? "s" : ""}`}
          compact
        />
      </div>
      <UsersList users={users} />
    </PageShell>
  );
}
