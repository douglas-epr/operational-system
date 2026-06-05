/**
 * /marketing/[projectId]/positioning — validation decision + positioning
 * statement + Brand DNA. Brand DNA (icp_definition JSONB) drives AI-generated
 * social posts and outreach copy. AI auto-fill pulls from the linked Sandbox idea.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { getProjectContext } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "../_components/MarketingProjectNav";
import PositioningEditor from "./_components/PositioningEditor";

export default async function PositioningPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const ctx = await getProjectContext(projectId);
  if (!ctx) notFound();

  if (!ctx.validation) {
    // No validation enabled yet — redirect to dashboard which handles enablement
    return notFound();
  }

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null}>
      <div className="mb-2">
        <Link
          href={`/marketing/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" strokeWidth={2} />
          {ctx.projectName || "Project"}
        </Link>
      </div>

      <h1 className="text-heading-1 text-text-primary mb-5">Positioning</h1>

      <MarketingProjectNav
        projectId={projectId}
        funnelMode={ctx.validation.funnel_mode}
      />

      <PositioningEditor projectId={projectId} validation={ctx.validation} />
    </PageShell>
  );
}
