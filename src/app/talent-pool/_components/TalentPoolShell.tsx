"use client";

/**
 * Top-level client shell for /talent-pool — renders the search bar,
 * settings toggle, filter row, "+ New Talent" button, talent list, and
 * the modal stack.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TalentRow as TalentRowType } from "@/types/talent";
import TalentRow from "./TalentRow";
import FilterRow, { type Filters } from "./FilterRow";
import TalentFormModal from "./modals/TalentFormModal";
import ShareLinkModal from "./modals/ShareLinkModal";
import { deleteTalent } from "../actions";
import { SearchIcon, AddIcon, SlidersIcon } from "@/components/ui/icons";

interface Props {
  talents: TalentRowType[];
  companies: { id: string; name: string }[];
  clients: { id: string; name: string | null; picture: string | null }[];
}

const EMPTY_FILTERS: Filters = {
  levels: [],
  authorityLevels: [],
  tools: [],
  languages: [],
  recommenderLevels: [],
  countries: [],
  companyIds: [],
};

export default function TalentPoolShell({ talents, companies, clients }: Props) {
  const router = useRouter();
  const [, startTrans] = useTransition();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [editing, setEditing] = useState<TalentRowType | null>(null);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<TalentRowType | null>(null);

  // Lookup maps
  const companiesById = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c])),
    [companies]
  );
  const talentsById = useMemo(
    () => Object.fromEntries(talents.map((t) => [t.id, t])),
    [talents]
  );

  // Filtering — all client-side from already-loaded data.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return talents.filter((t) => {
      if (q && !(t.name ?? "").toLowerCase().includes(q)) return false;

      if (filters.levels.length && !(t.level && filters.levels.includes(t.level))) return false;
      if (filters.authorityLevels.length && !(t.authority_level && filters.authorityLevels.includes(t.authority_level))) return false;
      if (filters.countries.length && !(t.country && filters.countries.includes(t.country))) return false;
      if (filters.companyIds.length && !(t.current_company_id && filters.companyIds.includes(t.current_company_id))) return false;

      if (filters.tools.length) {
        const have = new Set(t.tools.map((x) => x.tool));
        if (!filters.tools.some((x) => have.has(x as never))) return false;
      }
      if (filters.languages.length) {
        const have = new Set(t.programming_languages.map((x) => x.language));
        if (!filters.languages.some((x) => have.has(x as never))) return false;
      }
      if (filters.recommenderLevels.length) {
        const recs = t.recommender_ids
          .map((id) => talentsById[id])
          .filter(Boolean);
        const hit = recs.some((r) => r.level && filters.recommenderLevels.includes(r.level));
        if (!hit) return false;
      }
      return true;
    });
  }, [talents, search, filters, talentsById]);

  function handleDelete(t: TalentRowType) {
    if (!confirm(`Delete ${t.name ?? "this talent"}? This cannot be undone.`)) return;
    startTrans(async () => {
      const r = await deleteTalent(t.id);
      if (r.error) alert(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-elevated">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h1 className="text-xl font-bold text-text-primary">Talent Pool</h1>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <AddIcon className="w-4 h-4" strokeWidth={2} />
            New Talent
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search talent name…"
              className="input-field pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            title={showFilters ? "Hide filters" : "Show filters"}
            className={`p-2.5 rounded-md border transition-colors ${
              showFilters
                ? "bg-accent text-white border-accent"
                : "bg-muted text-text-secondary border-border hover:text-text-primary"
            }`}
          >
            <SlidersIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3">
            <FilterRow
              filters={filters}
              onChange={setFilters}
              companies={companies}
            />
            {Object.values(filters).some((v) => v.length > 0) && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="mt-2 text-xs text-text-muted hover:text-red-400"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {visible.length === 0 ? (
          <div className="text-center text-sm text-text-muted py-10">
            {talents.length === 0
              ? "No talents yet. Click + New Talent to get started."
              : "No talents match the current filters."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((t) => (
              <TalentRow
                key={t.id}
                talent={t}
                companyName={t.current_company_id ? companiesById[t.current_company_id]?.name ?? null : null}
                recommenders={t.recommender_ids
                  .map((id) => talentsById[id])
                  .filter(Boolean)}
                onEdit={() => setEditing(t)}
                onDelete={() => handleDelete(t)}
                onShare={() => setSharing(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TalentFormModal
        open={creating}
        onClose={() => setCreating(false)}
        companies={companies}
        talents={talents.map((t) => ({ id: t.id, name: t.name, picture: t.picture }))}
        clients={clients}
        onSaved={() => {
          setCreating(false);
          router.refresh();
        }}
      />
      <TalentFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        talent={editing ?? undefined}
        companies={companies}
        talents={talents.map((t) => ({ id: t.id, name: t.name, picture: t.picture }))}
        clients={clients}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
      <ShareLinkModal
        open={!!sharing}
        onClose={() => setSharing(null)}
        talentId={sharing?.id ?? null}
        talentName={sharing?.name ?? null}
      />
    </div>
  );
}
