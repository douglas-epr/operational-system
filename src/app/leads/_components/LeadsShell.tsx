"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/types/talent";
import type { Lead } from "@/types/leads";
import { deleteLead } from "../actions";
import LeadModal from "./LeadModal";
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, EmailIcon, LinkIcon } from "@/components/ui/icons";

interface Props {
  initialLeads: Lead[];
}

export default function LeadsShell({ initialLeads }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [modal, setModal] = useState<{ open: boolean; lead: Lead | null }>({
    open: false,
    lead: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);
  const [isPending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialLeads.filter((l) => {
      if (q && !(l.name ?? "").toLowerCase().includes(q)) return false;
      if (country && l.country !== country) return false;
      return true;
    });
  }, [initialLeads, search, country]);

  function handleDelete() {
    if (!confirmDelete) return;
    start(async () => {
      const r = await deleteLead(confirmDelete.id);
      if (r.error) {
        alert(r.error);
        return;
      }
      setConfirmDelete(null);
      router.refresh();
    });
  }

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Leads</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead name"
            className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent min-w-[140px]"
        >
          <option value="">Country</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={() => setModal({ open: true, lead: null })}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors"
        >
          <AddIcon className="w-4 h-4" strokeWidth={2} />
          New Lead
        </button>
      </div>

      <div className="text-right text-xs text-text-muted mb-4">
        {filtered.length} Lead{filtered.length === 1 ? "" : "s"}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-text-muted">
          No leads found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={() => setModal({ open: true, lead })}
              onDelete={() => setConfirmDelete(lead)}
            />
          ))}
        </div>
      )}

      <LeadModal
        open={modal.open}
        lead={modal.lead}
        onClose={() => setModal({ open: false, lead: null })}
      />

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
        >
          <div className="bg-elevated rounded-xl border border-border shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Delete lead?
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              This will permanently remove{" "}
              <span className="text-text-primary font-medium">
                {confirmDelete.name || "this lead"}
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = (lead.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border border-border rounded-lg bg-elevated p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden">
        {lead.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lead.picture} alt={lead.name ?? ""} className="w-full h-full object-cover" />
        ) : (
          initials || "—"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {lead.name || "Untitled"}
            </p>
            <p className="text-xs text-text-muted truncate">
              {lead.country || "—"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              aria-label="Edit lead"
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-muted rounded-md transition-colors"
            >
              <EditIcon className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete lead"
              className="p-1.5 text-text-muted hover:text-red-400 hover:bg-muted rounded-md transition-colors"
            >
              <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-text-muted">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              title={lead.email}
              className="hover:text-text-primary transition-colors"
            >
              <EmailIcon className="w-4 h-4" strokeWidth={1.8} />
            </a>
          )}
          {lead.linkedin && (
            <a
              href={lead.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              title={lead.linkedin}
              className="hover:text-text-primary transition-colors"
            >
              <LinkIcon className="w-4 h-4" strokeWidth={1.8} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
