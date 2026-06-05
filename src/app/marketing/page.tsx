/**
 * /marketing — Marketing Validation Engine admin zone (Phase 0).
 *
 * Lists every project with its validation config. Staff enable validation on a
 * project (creates the 1:1 `mkt_validation` row), then drill into the per-project
 * dashboard. Gated to admin / manager.
 */
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { listProjectsWithValidation } from "./actions";
import { getPortfolioMetricsMap } from "@/lib/marketing/admin";
import MarketingShell from "./_components/MarketingShell";

export default async function MarketingPage() {
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const projects = await listProjectsWithValidation();

  // Attach funnel metrics for projects that have validation enabled.
  const enabledIds = projects.filter((p) => p.validation).map((p) => p.project_id);
  const metricsMap = await getPortfolioMetricsMap(enabledIds);
  const withMetrics = projects.map((p) => ({
    ...p,
    metrics: metricsMap[p.project_id] ?? null,
  }));

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} flush>
      <MarketingShell initialProjects={withMetrics} />
    </PageShell>
  );
}
