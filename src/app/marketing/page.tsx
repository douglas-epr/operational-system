/**
 * /marketing — Marketing Validation Engine admin zone.
 *
 * Lists all ideas as cards. Staff can open any idea's marketing dashboard.
 * Gated to admin / manager.
 */
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { listIdeasWithValidation } from "./actions";
import { getPortfolioMetricsMap } from "@/lib/marketing/admin";
import MarketingShell from "./_components/MarketingShell";

export default async function MarketingPage() {
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const ideas = await listIdeasWithValidation();

  // Attach funnel metrics for ideas that have validation started.
  const validatedIds = ideas.filter((i) => i.validation).map((i) => i.idea_id);
  const metricsMap = await getPortfolioMetricsMap(validatedIds);
  const withMetrics = ideas.map((i) => ({
    ...i,
    metrics: metricsMap[i.idea_id] ?? null,
  }));

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} flush>
      <MarketingShell initialIdeas={withMetrics} />
    </PageShell>
  );
}
