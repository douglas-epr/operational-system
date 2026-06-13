/**
 * /marketing/[ideaId]/interviews — Interview Intelligence (signal-accuracy Part F).
 * Paste transcripts → Mom Test analysis per interview → cross-interview synthesis.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import type { MktInterview } from "@/types/marketing";
import { getIdeaContext } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "../_components/MarketingProjectNav";
import InterviewsShell from "./_components/InterviewsShell";

export default async function InterviewsPage({
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

  const [{ data: interviewRows }, { data: synthRow }] = await Promise.all([
    supabase
      .from("mkt_interview" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false }),
    supabase
      .from("mkt_research_cache" as never)
      .select("raw, scraped_at")
      .eq("idea_id", ideaId)
      .eq("source_key", "interview_synthesis")
      .maybeSingle(),
  ]);

  const interviews = (interviewRows ?? []) as unknown as MktInterview[];
  const synthesis =
    ((synthRow as { raw: Record<string, unknown> } | null)?.raw as Record<string, unknown>) ??
    null;

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

      <h1 className="text-heading-1 text-text-primary mb-5">Interviews</h1>

      <MarketingProjectNav
        ideaId={ideaId}
        funnelMode={ctx.validation?.funnel_mode ?? "hybrid"}
      />

      <InterviewsShell
        ideaId={ideaId}
        initialInterviews={interviews}
        initialSynthesis={synthesis}
        bookingUrl={ctx.validation?.booking_url ?? null}
      />
    </PageShell>
  );
}
