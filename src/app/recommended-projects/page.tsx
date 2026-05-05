/**
 * /recommended-projects — list of projects recommended by Devs/Agency Owners
 * or Clients. Mirrors the Bubble pages "recommended-projects" and
 * "referrer-dashboard" (docs/reference_docs/paginas.md L2319, L2962).
 *
 * Access:
 *   - admin / manager → see every project
 *   - referrer        → RLS clamps the result to projects where
 *                       project.referrer_id = auth.uid()
 *                       (policy "project: referrer read own", initial
 *                       schema migration L1277)
 *   - everyone else   → redirected to the homepage
 *
 * Privacy rule: enforced server-side by RLS — no extra filtering needed
 * in the query.
 */

import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type {
  Project,
  UserProfile,
  UserType,
} from "@/types/projects";
import RecommendedProjectsShell from "./_components/RecommendedProjectsShell";

export default async function RecommendedProjectsPage() {
  // Gate: admin/manager/operational/referrer. Other roles get the
  // role-specific redirect via the shared helper.
  const { supabase, userId, role } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
    "referrer",
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const userType = role as UserType;

  // Talents (for "Dev or Agency Owner" filter), clients (for "Client" filter)
  // and all profiles (for the project popup's User Picker / authorized users).
  // For admins/managers we further clamp the project list to rows with at
  // least one recommender FK set — otherwise plain internal projects would
  // pollute the dashboard. Referrers are already clamped by RLS to projects
  // where referrer_id = auth.uid().
  const [
    { data: projectsData },
    { data: talentsData },
    { data: clientsData },
    { data: profilesData },
  ] = await Promise.all([
    supabase
      .from("project")
      .select(
        "id, name, picture, status, stage, program, description, price, referrer_commission, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, recommended_by, talent_who_recommended_id, client_who_recommended_id, company_that_recommended_id, referrer_id, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("talent").select("id, name, current_company_id").order("name"),
    supabase.from("client").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, picture, type"),
  ]);

  const allProjects = (projectsData ?? []) as unknown as Project[];
  // Show only projects with at least one recommender link.
  const projects =
    userType === "referrer"
      ? allProjects
      : allProjects.filter(
          (p) =>
            !!p.referrer_id ||
            !!p.company_that_recommended_id ||
            !!p.talent_who_recommended_id ||
            !!p.client_who_recommended_id
        );
  const talents = (talentsData ?? []) as { id: string; name: string | null; current_company_id: string | null }[];
  const clients = (clientsData ?? []) as { id: string; name: string | null }[];
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} fullBleed flush>
      <RecommendedProjectsShell
        projects={projects}
        talents={talents}
        clients={clients}
        userType={userType}
        profiles={profiles}
      />
    </PageShell>
  );
}
