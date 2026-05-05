/**
 * /talent-pool — server component.
 *
 * Mirrors the Bubble "Talent Pool" page (docs/reference_docs/paginas.md).
 * Restricted to admin/manager/operational. Loads talents + their joined
 * tools / programming languages / recommenders / client referrers, plus
 * companies and clients for the modal lookup pickers.
 */

import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile, UserType } from "@/types/projects";
import type { TalentRow } from "@/types/talent";
import TalentPoolShell from "./_components/TalentPoolShell";

export default async function TalentPoolPage() {
  // Gate: admin/manager/operational. Other roles bounce via the shared
  // helper.
  const { supabase, userId, role } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const userType = role as UserType;

  // Parallel data load.
  const [talentsRes, toolsRes, langsRes, refRes, clientRefRes, companiesRes, clientsRes] =
    await Promise.all([
      supabase
        .from("talent")
        .select(
          "id, code, code_expires_at, name, email, phone, linkedin, picture, portfolio, country, current_job_position, level, authority_level, current_company_id, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("talent_tool").select("talent_id, tool, score"),
      supabase
        .from("talent_programming_language")
        .select("talent_id, programming_language, score"),
      supabase.from("talent_referred_by").select("talent_id, referred_by_id"),
      supabase
        .from("client_who_referred_this_talent")
        .select("talent_id, client_id"),
      supabase.from("company").select("id, name").order("name"),
      supabase.from("client").select("id, name, picture").order("name"),
    ]);

  // Group children by talent id.
  const toolsByTalent = new Map<string, { tool: string; score: number | null }[]>();
  for (const row of toolsRes.data ?? []) {
    if (!row.talent_id || !row.tool) continue;
    const arr = toolsByTalent.get(row.talent_id) ?? [];
    arr.push({ tool: row.tool, score: row.score });
    toolsByTalent.set(row.talent_id, arr);
  }
  const langsByTalent = new Map<string, { language: string; score: number | null }[]>();
  for (const row of langsRes.data ?? []) {
    if (!row.talent_id || !row.programming_language) continue;
    const arr = langsByTalent.get(row.talent_id) ?? [];
    arr.push({ language: row.programming_language, score: row.score });
    langsByTalent.set(row.talent_id, arr);
  }
  const refsByTalent = new Map<string, string[]>();
  for (const row of refRes.data ?? []) {
    if (!row.talent_id || !row.referred_by_id) continue;
    const arr = refsByTalent.get(row.talent_id) ?? [];
    arr.push(row.referred_by_id);
    refsByTalent.set(row.talent_id, arr);
  }
  const clientRefsByTalent = new Map<string, string[]>();
  for (const row of clientRefRes.data ?? []) {
    if (!row.talent_id || !row.client_id) continue;
    const arr = clientRefsByTalent.get(row.talent_id) ?? [];
    arr.push(row.client_id);
    clientRefsByTalent.set(row.talent_id, arr);
  }

  const talents: TalentRow[] = (talentsRes.data ?? []).map((t) => ({
    id: t.id,
    code: t.code,
    code_expires_at: t.code_expires_at,
    name: t.name,
    email: t.email,
    phone: t.phone,
    linkedin: t.linkedin,
    picture: t.picture,
    portfolio: t.portfolio,
    country: t.country,
    current_job_position: t.current_job_position,
    level: t.level,
    authority_level: t.authority_level,
    current_company_id: t.current_company_id,
    created_at: t.created_at,
    tools: (toolsByTalent.get(t.id) ?? []) as TalentRow["tools"],
    programming_languages: (langsByTalent.get(t.id) ?? []) as TalentRow["programming_languages"],
    recommender_ids: refsByTalent.get(t.id) ?? [],
    client_referrer_ids: clientRefsByTalent.get(t.id) ?? [],
  }));

  const companies = (companiesRes.data ?? []) as { id: string; name: string }[];
  const clients = (clientsRes.data ?? []) as { id: string; name: string | null; picture: string | null }[];

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} fullBleed flush>
      <TalentPoolShell talents={talents} companies={companies} clients={clients} />
    </PageShell>
  );
}
