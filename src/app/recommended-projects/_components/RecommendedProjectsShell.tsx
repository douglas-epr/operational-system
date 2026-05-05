"use client";

/**
 * Client shell for /recommended-projects.
 *
 * Layout matches the Bubble page (docs/reference_docs/paginas.md L2319):
 *   - search box + filters row
 *   - 3 KPI cards (Blur Studio, Devs/Agency Owners + Clients, Projects)
 *   - project list (name | status | price | commission | provider revenue | profit)
 *
 * For referrer users, the "Devs/Agency Owners + Clients" card is replaced
 * with a "Your Earnings" card (matches screenshot 5 of the user's brief),
 * and the table drops the "Provider Revenue" / "Profit" columns in favour
 * of the referrer's own earned revenue.
 */

import { useMemo, useState } from "react";
import type { Project, ProjectStatus, UserProfile, UserType } from "@/types/projects";
import ProjectModal from "@/app/projects/_components/modals/ProjectModal";
import { SearchIcon, ImageIcon } from "@/components/ui/icons";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  prospecting: "Prospecting",
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
  lost_deal: "Lost Deal",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  prospecting: "bg-[#1c3557] text-[#93c5fd]",
  not_started: "bg-[#27272a] text-[#a1a1aa]",
  in_progress: "bg-[#422006] text-[#fde68a]", // yellow chip in screenshots
  done:        "bg-[#14532d] text-[#86efac]",
  blocked:     "bg-[#7f1d1d] text-[#fca5a5]",
  archived:    "bg-accent text-white",       // blue chip in screenshots
  lost_deal:   "bg-[#3b0764] text-[#d8b4fe]",
};

interface Props {
  projects: Project[];
  talents: { id: string; name: string | null; current_company_id: string | null }[];
  clients: { id: string; name: string | null }[];
  userType: UserType;
  profiles: UserProfile[];
}

function fmtMoney(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function RecommendedProjectsShell({
  projects,
  talents,
  clients,
  userType,
  profiles,
}: Props) {
  const isReferrer = userType === "referrer";

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [talentFilter, setTalentFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");

  // ── Project popup state ────────────────────────────────────────────────────
  const [projectModal, setProjectModal] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !(p.name ?? "").toLowerCase().includes(q)) return false;
      if (talentFilter && p.talent_who_recommended_id !== talentFilter) return false;
      if (clientFilter && p.client_who_recommended_id !== clientFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, search, talentFilter, clientFilter, statusFilter]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  // commission % is per-project; provider revenue = price * commission/100.
  // Blur Studio revenue = price - provider revenue.
  // Profit (admin/manager view) mirrors revenue here since we don't have a
  // separate cost column — matches the Bubble dashboard.
  const kpis = useMemo(() => {
    let blurRevenue = 0;
    let blurProfit  = 0;
    let providerRevenue = 0;
    for (const p of filtered) {
      const price = p.price ?? 0;
      const commission = p.referrer_commission ?? 0;
      const providerCut = price * (commission / 100);
      providerRevenue += providerCut;
      blurRevenue += price - providerCut;
      blurProfit  += price - providerCut;
    }
    return { blurRevenue, blurProfit, providerRevenue, count: filtered.length };
  }, [filtered]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-2 shrink-0">
        <h1 className="text-heading-3 text-text-primary mb-4">Projects</h1>

        {/* Filters row */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project name"
              className="input-field pl-9"
            />
          </div>
          {!isReferrer && (
            <>
              <select
                value={talentFilter}
                onChange={(e) => setTalentFilter(e.target.value)}
                className="input-field max-w-[200px]"
                title="Filter by Dev or Agency Owner"
              >
                <option value="">Dev or Agency Owner</option>
                {talents.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name ?? "Unnamed"}
                  </option>
                ))}
              </select>
              <select
                value=""
                onChange={() => { /* placeholder — agencies are companies, not yet wired */ }}
                disabled
                className="input-field max-w-[180px] opacity-60"
                title="Agency filter (coming soon)"
              >
                <option value="">Agency</option>
              </select>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="input-field max-w-[180px]"
                title="Filter by Client"
              >
                <option value="">Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? "Unnamed"}
                  </option>
                ))}
              </select>
            </>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
            className="input-field max-w-[170px]"
            title="Filter by status"
          >
            <option value="">Project status</option>
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <KpiCard title="Blur Studio">
            <KpiRow label="Revenue" value={fmtMoney(kpis.blurRevenue)} />
            {!isReferrer && (
              <KpiRow label="Profit" value={fmtMoney(kpis.blurProfit)} />
            )}
          </KpiCard>

          <KpiCard
            title={
              isReferrer
                ? "Your Earnings"
                : "Devs, Agency Owners, and Clients"
            }
          >
            <KpiRow
              label="Revenue"
              value={fmtMoney(kpis.providerRevenue)}
            />
          </KpiCard>

          <KpiCard title="Projects">
            <KpiRow label="Quantity" value={String(kpis.count)} />
          </KpiCard>
        </div>

        {/* Table */}
        <div className="bg-elevated border border-border rounded-lg overflow-hidden">
          <div
            className={
              isReferrer
                ? "grid grid-cols-[40px_minmax(0,2fr)_120px_100px_100px_120px] items-center px-4 py-3 bg-muted/30 text-xs font-semibold text-text-secondary"
                : "grid grid-cols-[40px_minmax(0,2fr)_120px_100px_100px_140px_120px] items-center px-4 py-3 bg-muted/30 text-xs font-semibold text-text-secondary"
            }
          >
            <span>
              <ImageIcon className="w-4 h-4 text-text-muted" strokeWidth={2} />
            </span>
            <span>Name</span>
            <span>Status</span>
            <span>Price</span>
            <span>Commission</span>
            {!isReferrer && <span>Provider Revenue</span>}
            <span>{isReferrer ? "Revenue" : "Profit"}</span>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-text-muted">
              No projects to display.
            </div>
          )}

          {filtered.map((p) => {
            const price = p.price ?? 0;
            const commission = p.referrer_commission ?? 0;
            const providerCut = price * (commission / 100);
            const profit = price - providerCut;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectModal({ open: true, project: p })}
                className={
                  (isReferrer
                    ? "grid grid-cols-[40px_minmax(0,2fr)_120px_100px_100px_120px]"
                    : "grid grid-cols-[40px_minmax(0,2fr)_120px_100px_100px_140px_120px]") +
                  " w-full text-left items-center px-4 py-3 border-t border-border hover:bg-muted/30 transition-colors"
                }
              >
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs text-text-muted">
                  {p.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    "project"
                  )}
                </div>
                <span className="text-sm text-text-primary truncate">
                  {p.name ?? "Unnamed"}
                </span>
                <span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </span>
                <span className="text-sm text-text-secondary">{fmtMoney(price)}</span>
                <span className="text-sm text-text-secondary">{commission}%</span>
                {!isReferrer && (
                  <span className="text-sm text-text-secondary">
                    {fmtMoney(providerCut)}
                  </span>
                )}
                <span className="text-sm text-text-secondary">
                  {fmtMoney(isReferrer ? providerCut : profit)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project popup — opened when a row is clicked. Read-only for referrer
          users (they're not admin/manager so the modal hides edit affordances). */}
      <ProjectModal
        open={projectModal.open}
        onClose={() => setProjectModal({ open: false, project: null })}
        project={projectModal.project}
        profiles={profiles}
        taskProgress={null}
      />
    </div>
  );
}

function KpiCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-elevated border border-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base/50 border border-border rounded-md p-3 flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-lg font-bold text-accent">{value}</span>
    </div>
  );
}
