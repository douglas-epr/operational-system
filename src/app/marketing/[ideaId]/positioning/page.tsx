/**
 * /marketing/[ideaId]/positioning — validation decision + positioning
 * statement + Brand DNA. Brand DNA (icp_definition JSONB) drives AI-generated
 * social posts and outreach copy. AI auto-fill pulls from the linked idea data.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import type { MktValidation } from "@/types/marketing";
import { getIdeaContext } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "../_components/MarketingProjectNav";
import PositioningEditor from "./_components/PositioningEditor";

export default async function PositioningPage({
  params,
}: {
  params: Promise<{ ideaId: string }>;
}) {
  const { ideaId } = await params;
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const ctx = await getIdeaContext(ideaId);
  if (!ctx) notFound();

  // Auto-create a default validation record on first visit to this page
  let validation = ctx.validation;
  if (!validation) {
    const { data: created } = await supabase
      .from("mkt_validation" as never)
      .insert({
        idea_id: ideaId,
        funnel_mode: "hybrid",
        status: "validating",
        created_by: userId,
      } as never)
      .select()
      .single();
    validation = created as MktValidation | null;
  }

  if (!validation) notFound();

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null}>
      <div className="mb-2">
        <Link
          href={`/marketing/${ideaId}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" strokeWidth={2} />
          {ctx.ideaName || "Idea"}
        </Link>
      </div>

      <h1 className="text-heading-1 text-text-primary mb-5">Positioning</h1>

      <MarketingProjectNav
        ideaId={ideaId}
        funnelMode={validation.funnel_mode}
      />

      <PositioningEditor ideaId={ideaId} validation={validation} />
    </PageShell>
  );
}
