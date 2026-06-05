/**
 * /marketing/[projectId]/signals — captured demand signals (Phase 1).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import KpiCard from "@/components/ui/KpiCard";
import type { UserProfile } from "@/types/projects";
import type { MktSignal } from "@/types/marketing";
import { getProjectContext, getFunnelMetrics } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import SignalsTable from "./_components/SignalsTable";

export default async function SignalsPage({
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

  const m = await getFunnelMetrics(projectId);

  const { data: signalsData } = await supabase
    .from("mkt_signal" as never)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(500);

  const signals = (signalsData ?? []) as unknown as MktSignal[];

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

      <h1 className="text-heading-1 text-text-primary mb-5">Signals</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Quiz" value={m.quiz.toLocaleString()} />
        <KpiCard label="Waitlist" value={m.waitlist.toLocaleString()} />
        <KpiCard label="Pre-orders" value={m.preorders.toLocaleString()} />
        <KpiCard label="Page views" value={m.views.toLocaleString()} />
      </div>

      <SignalsTable signals={signals} />
    </PageShell>
  );
}
