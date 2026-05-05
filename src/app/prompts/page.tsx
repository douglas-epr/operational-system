/**
 * Prompts management page — server component.
 * Admin/manager only. Fetches prompt groups with their prompts and renders the shell.
 */
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import PromptsShell from "./_components/PromptsShell";
import { getPromptGroups } from "./actions";

export default async function PromptsPage() {
  // Gate: admin/manager only. Other roles redirect via the shared helper:
  // dev/client/operational/qa → /projects, referrer → /recommended-projects,
  // lead → /sandbox-planner.
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const { data: groups } = await getPromptGroups();

  return (
    <PageShell profile={profile} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader title="Prompts" compact />
      </div>
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <PromptsShell groups={groups ?? []} />
      </div>
    </PageShell>
  );
}
