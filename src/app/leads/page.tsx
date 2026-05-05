import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { listLeads } from "./actions";
import LeadsShell from "./_components/LeadsShell";

export default async function LeadsPage() {
  // Gate: admin/manager/operational. Other roles get the role-specific
  // redirect from the shared helper.
  const { supabase, userId } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const leads = await listLeads();

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} flush>
      <LeadsShell initialLeads={leads} />
    </PageShell>
  );
}
