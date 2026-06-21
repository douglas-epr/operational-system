/**
 * /feedback page — server component.
 *
 * Mirrors the Bubble "feedback" page (docs/reference_docs/paginas.md §feedback,
 * tabelas.md §feedback). Every authenticated user can submit feedback about a
 * project; admin/manager see the full wall, non-managers see their own posts.
 */
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile, UserType, Project } from "@/types/projects";
import type { Feedback } from "@/types/feedback";
import FeedbackShell from "./_components/FeedbackShell";

export default async function FeedbackPage() {
  // Gate: every authenticated user. The shared helper handles the
  // `if (!user) redirect("/signin")` step uniformly.
  const { supabase, userId, role } = await requirePageAccess({ allowAll: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const userType = role as UserType;
  const isAdminOrManager = userType === "admin" || userType === "manager";

  // Profiles map — to render avatar + name on each card.
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type");
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  // Projects the user is allowed to pick when creating feedback.
  let projectsQuery = supabase
    .from("project")
    .select("id, name, authorized_users")
    .order("created_at", { ascending: false });
  if (!isAdminOrManager) {
    projectsQuery = projectsQuery.contains("authorized_users", [userId]);
  }
  const { data: projectsData } = await projectsQuery;
  const projects = (projectsData ?? []) as unknown as Pick<
    Project,
    "id" | "name" | "authorized_users"
  >[];

  // Feedback rows. RLS grants:
  //   - admin/manager → all rows
  //   - everyone authed → full read too
  // so the UI-level "is this mine?" check stays simple.
  const { data: feedbackData } = await supabase
    .from("feedback")
    .select("id, project_id, comment, rating, user_type, created_by, created_at, updated_at")
    .order("created_at", { ascending: false });
  const feedback = (feedbackData ?? []) as unknown as Feedback[];

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} fullBleed flush>
      <FeedbackShell
        currentUserId={userId}
        currentUserType={userType}
        isAdminOrManager={isAdminOrManager}
        profiles={profiles}
        projects={projects}
        feedback={feedback}
      />
    </PageShell>
  );
}
