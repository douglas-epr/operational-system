/**
 * /marketing/[ideaId]/sourcing — Apify Google Maps lead sourcing (Phase 2).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { getIdeaContext } from "@/lib/marketing/admin";
import { listSourceRuns } from "./actions";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "../_components/MarketingProjectNav";
import SourcingShell from "./_components/SourcingShell";

export default async function SourcingPage({
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

  const runs = await listSourceRuns(ideaId);

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

      <h1 className="text-heading-1 text-text-primary mb-5">Sourcing</h1>
      <MarketingProjectNav ideaId={ideaId} funnelMode={ctx.validation?.funnel_mode ?? "hybrid"} />

      <SourcingShell ideaId={ideaId} initialRuns={runs} />
    </PageShell>
  );
}
