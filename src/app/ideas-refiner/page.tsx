/**
 * Ideas Refiner page — server component.
 * Handles auth, data fetching, and renders the client shell.
 */
import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import SandboxPlannerShell from "./_components/SandboxPlannerShell";
import { loadIdeaFull } from "./_lib/loadIdeaFull";
import {
  normalizeTabParam,
} from "@/types/idea-refiner";
import type {
  Idea,
  IdeaBlock,
  IdeaFull,
  ProjectOption,
} from "@/types/idea-refiner";
import type { UserProfile } from "@/types/projects";
import type { UserAiSettingsClient } from "@/types/settings";
import { DEFAULT_OPENROUTER_MODEL } from "@/types/settings";

// Hobby plan cap is 300 s. The debate pipeline (risk_and_validation, report) was
// optimised to ~80–130 s via compact source blocks, so 300 s is sufficient.
export const maxDuration = 300;

interface PageProps {
  searchParams: Promise<{ idea?: string; tab?: string; project?: string }>;
}

export default async function SandboxPlannerPage({ searchParams }: PageProps) {
  // Gate: admin/manager/operational/developer/client/lead. qa →
  // /projects, referrer → /recommended-projects via the shared helper.
  const { supabase, userId } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
    "developer",
    "client",
    "lead",
  ]);

  // Fetch user profile for the Sidebar.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const params = await searchParams;
  const ideaId = params.idea;
  const tabParam = normalizeTabParam(params.tab);
  const projectParam = params.project ?? null;

  // Fetch ideas, projects, AI model preference, and profiles in parallel
  const [{ data: ideasData }, { data: projectsData }, { data: aiSettingsData }, { data: profilesRaw }] =
    await Promise.all([
      supabase
        .from("idea")
        .select("id, project_id, created_by, name, version_name, authorized_users, score, description, success_metrics, current_block_ended, current_blocks_updating, created_at, project:project_id(id, name), creator:created_by(first_name, last_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("project")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase
        .from("user_ai_settings" as never)
        .select("openrouter_model")
        .eq("owner_id" as never, userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, picture, type")
        .order("first_name", { ascending: true }),
    ]);
  const profiles: UserProfile[] = (profilesRaw ?? []) as UserProfile[];

  const ideasRaw = (ideasData ?? []) as unknown as (Idea & {
    creator?: { first_name: string | null; last_name: string | null } | null;
  })[];
  const ideas: Idea[] = ideasRaw.map((i) => ({
    ...i,
    authorized_users: (i.authorized_users ?? []) as string[],
    creator_name:
      [i.creator?.first_name, i.creator?.last_name].filter(Boolean).join(" ") || null,
  }));
  const projects = (projectsData ?? []) as unknown as ProjectOption[];

  const aiSettingsRow = aiSettingsData as unknown as {
    openrouter_model: string | null;
  } | null;

  const role = (profile as { type?: string | null } | null)?.type ?? null;
  const isAdminOrManager = role === "admin" || role === "manager";

  const aiSettings: UserAiSettingsClient = {
    model: aiSettingsRow?.openrouter_model ?? DEFAULT_OPENROUTER_MODEL,
  };

  // If an idea is selected, fetch full data for refinement steps
  let ideaFull: IdeaFull | null = null;

  if (ideaId) {
    ideaFull = await loadIdeaFull(supabase, ideaId);
    if (!ideaFull) {
      redirect("/ideas-refiner");
    }
  }

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User";

  return (
    <PageShell profile={profile} fullBleed flush>
      <SandboxPlannerShell
        ideas={ideas}
        projects={projects}
        profiles={profiles}
        ideaFull={ideaFull}
        initialTab={tabParam ?? "ideas"}
        userName={userName}
        currentUserId={userId}
        isAdminOrManager={isAdminOrManager}
        selectedProjectId={projectParam}
        aiSettings={aiSettings}
      />
    </PageShell>
  );
}
