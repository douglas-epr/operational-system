/**
 * /marketing/[ideaId]/traffic — paid-traffic tracker (signal-accuracy Part I-1).
 * Campaigns get locked-UTM ad URLs; attribution joins on utm_campaign.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { getIdeaContext } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "../_components/MarketingProjectNav";
import TrafficShell from "./_components/TrafficShell";
import SeoEngine from "./_components/SeoEngine";
import BlendedIntelligence from "./_components/BlendedIntelligence";
import { listAdCampaigns, getTrafficOverview } from "./actions";
import { listSeoKeywords } from "./seo-actions";

export default async function TrafficPage({
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

  const [{ campaigns, landingSlug }, { data: seoKeywords }, overview] = await Promise.all([
    listAdCampaigns(ideaId),
    listSeoKeywords(ideaId),
    getTrafficOverview(ideaId),
  ]);

  const landingPublished =
    !!landingSlug &&
    !!(await supabase
      .from("mkt_landing" as never)
      .select("published")
      .eq("idea_id", ideaId)
      .eq("published", true)
      .maybeSingle()
      .then((r: { data: unknown }) => r.data));

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

      <h1 className="text-heading-1 text-text-primary mb-5">Paid traffic</h1>

      <MarketingProjectNav
        ideaId={ideaId}
        funnelMode={ctx.validation?.funnel_mode ?? "hybrid"}
      />

      <TrafficShell
        ideaId={ideaId}
        initialCampaigns={campaigns}
        landingSlug={landingSlug}
      />

      <div className="mt-6">
        <BlendedIntelligence
          overview={overview}
          landingPublished={landingPublished}
          hasSeoKeywords={(seoKeywords ?? []).length > 0}
        />
      </div>

      <div className="mt-6">
        <SeoEngine
          ideaId={ideaId}
          initialKeywords={seoKeywords ?? []}
        />
      </div>
    </PageShell>
  );
}
