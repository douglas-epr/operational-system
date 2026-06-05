/**
 * /marketing/[projectId]/content — calendar-first content studio (Phase 4).
 * Channels come from Buffer; posts are mkt_content rows.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { getProjectContext } from "@/lib/marketing/admin";
import { getChannels, listContent } from "./actions";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "../_components/MarketingProjectNav";
import ContentStudio from "./_components/ContentStudio";

export default async function ContentPage({
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

  const { channels, error: channelsError } = await getChannels();
  const content = await listContent(projectId);

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

      <h1 className="text-heading-1 text-text-primary mb-5">Content</h1>
      <MarketingProjectNav projectId={projectId} funnelMode={ctx.validation?.funnel_mode ?? "hybrid"} />

      <ContentStudio
        projectId={projectId}
        channels={channels}
        channelsError={channelsError ?? null}
        initialContent={content}
      />
    </PageShell>
  );
}
