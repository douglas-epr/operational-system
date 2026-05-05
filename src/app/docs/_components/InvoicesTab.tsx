"use client";

/**
 * Docs ▸ Invoices tab.
 * Grid of saved invoices with a "+ New invoice" button and a download
 * control that opens the print-friendly invoice view in a new window.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, UserProfile } from "@/types/projects";
import type { ProjectInvoice } from "@/types/docs";
import { deleteProjectInvoice } from "../actions";
import InvoiceFormModal from "./modals/InvoiceFormModal";
import InvoicePreview from "./InvoicePreview";

interface Props {
  project: Project;
  profiles: UserProfile[];
  invoices: ProjectInvoice[];
  currentUserId: string;
  isAdminOrManager: boolean;
}

export default function InvoicesTab({
  project,
  profiles,
  invoices,
  currentUserId,
  isAdminOrManager,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectInvoice | null>(null);
  const [previewing, setPreviewing] = useState<ProjectInvoice | null>(null);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  // Per the revised privacy spec (2026-04-25): any member of
  // `project.authorized_users` may create an invoice. Admins and managers
  // additionally see every invoice on the project (RLS: ALL for them,
  // creator-only SELECT for everyone else).
  const canCreate =
    isAdminOrManager || project.authorized_users.includes(currentUserId);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(i: ProjectInvoice) {
    setEditing(i);
    setFormOpen(true);
  }

  async function handleDelete(i: ProjectInvoice) {
    if (!confirm(`Delete invoice "${i.code}"?`)) return;
    const res = await deleteProjectInvoice(i.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Invoices</h3>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New invoice
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {invoices.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">
                No invoices yet
              </h4>
              <p className="text-xs text-text-muted">
                {canCreate
                  ? 'Click "+ New invoice" to generate your first invoice.'
                  : "No invoices have been issued for this project."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {invoices.map((i) => {
              const owner = profileById.get(i.created_by);
              const ownerName = owner
                ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "?"
                : "?";
              const canEdit =
                isAdminOrManager || i.created_by === currentUserId;
              const canDelete = canEdit;
              const priceLabel =
                i.service_price !== null
                  ? i.service_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—";

              return (
                <li
                  key={i.id}
                  className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 bg-accent/10 border-b border-border">
                    <p className="text-[11px] uppercase tracking-widest text-accent font-semibold">
                      Invoice
                    </p>
                    <p className="text-sm font-semibold text-text-primary truncate">
                      #{i.code}
                    </p>
                  </div>

                  <div className="px-4 py-3 flex flex-col gap-2 flex-1">
                    <Row label="Client" value={i.client_name ?? i.company_or_user_name ?? "—"} />
                    <Row label="Amount" value={`$ ${priceLabel}`} />
                    <Row
                      label="Due date"
                      value={
                        i.due_date
                          ? new Date(`${i.due_date}T00:00:00`).toLocaleDateString()
                          : "—"
                      }
                    />
                    <Row label="Issued by" value={ownerName} />
                  </div>

                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border bg-muted/20">
                    <button
                      onClick={() => setPreviewing(i)}
                      className="text-[11px] text-accent hover:underline"
                    >
                      Preview / Download
                    </button>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(i)}
                          className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(i)}
                          className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <InvoiceFormModal
          project={project}
          invoice={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      {previewing && (
        <InvoicePreview
          invoice={previewing}
          project={project}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-text-muted uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <span className="text-text-primary truncate">{value}</span>
    </div>
  );
}
