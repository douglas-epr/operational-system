"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/types/docs";
import { deleteInvoice } from "../actions";
import InvoiceFormModal from "./InvoiceFormModal";
import InvoicePreview from "./InvoicePreview";

interface Props {
  invoices: Invoice[];
  currentUserId: string;
}

export default function InvoicesList({ invoices, currentUserId }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [previewing, setPreviewing] = useState<Invoice | null>(null);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(i: Invoice) { setEditing(i); setFormOpen(true); }

  async function handleDelete(i: Invoice) {
    if (!confirm(`Delete invoice "${i.code}"?`)) return;
    const res = await deleteInvoice(i.id);
    if (res.error) { alert(res.error); return; }
    router.refresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-heading-3 text-text-primary">Invoices</h1>
        <button
          onClick={openCreate}
          className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
        >
          + New invoice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {invoices.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">No invoices yet</h4>
              <p className="text-xs text-text-muted">Click &quot;+ New invoice&quot; to create your first invoice.</p>
            </div>
          </div>
        ) : (
          <ul className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {invoices.map((i) => {
              const canEdit = i.created_by === currentUserId;
              const priceLabel =
                i.service_price !== null
                  ? i.service_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : "—";

              return (
                <li key={i.id} className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
                  <div className="px-4 py-3 bg-accent/10 border-b border-border">
                    <p className="text-[11px] uppercase tracking-widest text-accent font-semibold">Invoice</p>
                    <p className="text-sm font-semibold text-text-primary truncate">#{i.code}</p>
                  </div>

                  <div className="px-4 py-3 flex flex-col gap-2 flex-1">
                    <Row label="Client" value={i.client_name ?? i.company_or_user_name ?? "—"} />
                    <Row label="Amount" value={`$ ${priceLabel}`} />
                    <Row
                      label="Due date"
                      value={i.due_date ? new Date(`${i.due_date}T00:00:00`).toLocaleDateString() : "—"}
                    />
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
                        <>
                          <button
                            onClick={() => openEdit(i)}
                            className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(i)}
                            className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                          >
                            Delete
                          </button>
                        </>
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
          invoice={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      {previewing && (
        <InvoicePreview invoice={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-text-muted uppercase tracking-wider text-[10px]">{label}</span>
      <span className="text-text-primary truncate">{value}</span>
    </div>
  );
}
