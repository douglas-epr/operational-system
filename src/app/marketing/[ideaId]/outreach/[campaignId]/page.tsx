/**
 * /marketing/[ideaId]/outreach/[campaignId] — campaign detail (Phase 3).
 * Sequence editor + prospect enrollment + send status.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import type { MktCampaign, MktProspect } from "@/types/marketing";
import { getIdeaContext } from "@/lib/marketing/admin";
import { listSteps, listProspects, listOutreach } from "../actions";
import { ChevronLeftIcon } from "@/components/ui/icons";
import CampaignDetail from "./_components/CampaignDetail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ ideaId: string; campaignId: string }>;
}) {
  const { ideaId, campaignId } = await params;
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const ctx = await getIdeaContext(ideaId);
  if (!ctx) notFound();

  const { data: campaignData } = await supabase
    .from("mkt_campaign" as never)
    .select("*")
    .eq("id", campaignId)
    .eq("idea_id", ideaId)
    .maybeSingle();
  const campaign = (campaignData as unknown as MktCampaign) ?? null;
  if (!campaign) notFound();

  const [steps, prospects, outreach] = await Promise.all([
    listSteps(ideaId, campaignId),
    listProspects(ideaId),
    listOutreach(ideaId, campaignId),
  ]);

  const prospectById: Record<string, MktProspect> = {};
  for (const p of prospects) prospectById[p.id] = p;

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null}>
      <div className="mb-2">
        <Link
          href={`/marketing/${ideaId}/outreach`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" strokeWidth={2} />
          Outreach
        </Link>
      </div>

      <CampaignDetail
        ideaId={ideaId}
        campaign={campaign}
        initialSteps={steps}
        prospects={prospects}
        initialOutreach={outreach}
        prospectById={prospectById}
      />
    </PageShell>
  );
}
