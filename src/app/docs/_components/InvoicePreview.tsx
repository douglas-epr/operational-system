"use client";

/**
 * Printable invoice preview modal.
 * Shows a formatted invoice matching the purple-accent design reference; the
 * "Download" button triggers the browser print dialog so the user can save
 * as PDF. CSS `@media print` hides everything except the invoice body.
 */

import type { Project } from "@/types/projects";
import type { ProjectInvoice } from "@/types/docs";

interface Props {
  project: Project;
  invoice: ProjectInvoice;
  onClose: () => void;
}

function formatMoney(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InvoicePreview({ project, invoice, onClose }: Props) {
  function handleDownload() {
    window.print();
  }

  const issueDate = new Date(invoice.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 invoice-preview-backdrop"
      onClick={onClose}
    >
      {/* Print-only styles: hide chrome, show invoice body full-bleed. */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .invoice-printable,
          .invoice-printable * {
            visibility: visible !important;
          }
          .invoice-printable {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            padding: 32px !important;
            box-shadow: none !important;
          }
          .invoice-preview-backdrop {
            background: white !important;
          }
          .invoice-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-neutral-900 w-full max-w-3xl max-h-[92vh] rounded-lg shadow-xl flex flex-col overflow-hidden"
      >
        <div className="invoice-no-print flex items-center justify-between px-5 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-700">
            Invoice preview
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
            >
              Download (Print → Save as PDF)
            </button>
            <button
              onClick={onClose}
              className="text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="invoice-printable bg-white p-10">
            {/* Header strip */}
            <div className="flex items-center justify-between pb-6 border-b-4 border-purple-600">
              <div>
                <p className="text-4xl font-black tracking-widest text-purple-700">
                  INVOICE
                </p>
                <p className="text-xs text-neutral-500 mt-1">#{invoice.code}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Project
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {project.name ?? "Untitled project"}
                </p>
              </div>
            </div>

            {/* Issuer / Client block */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  From
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {invoice.company_or_user_name ?? "—"}
                </p>
                {invoice.document_number && (
                  <p className="text-xs text-neutral-600">
                    ID: {invoice.document_number}
                  </p>
                )}
                {invoice.address && (
                  <p className="text-xs text-neutral-600 whitespace-pre-line">
                    {invoice.address}
                  </p>
                )}
                {invoice.phone && (
                  <p className="text-xs text-neutral-600">{invoice.phone}</p>
                )}
                {invoice.email && (
                  <p className="text-xs text-neutral-600">{invoice.email}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  Invoice to
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {invoice.client_name ?? "—"}
                </p>
              </div>
            </div>

            {/* Dates + amount */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <InfoBlock label="Issue Date" value={issueDate} />
              <InfoBlock label="Due Date" value={formatDate(invoice.due_date)} />
              <InfoBlock
                label="Amount Payable"
                value={`$ ${formatMoney(invoice.service_price)}`}
                emphasized
              />
            </div>

            {/* Service description table */}
            <div className="mt-10">
              <div className="bg-purple-700 text-white px-4 py-2 grid grid-cols-[1fr_140px] text-[11px] uppercase tracking-widest">
                <span>Service</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="border border-t-0 border-neutral-200">
                <div className="px-4 py-3 grid grid-cols-[1fr_140px]">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {invoice.service_title ?? "—"}
                    </p>
                    {invoice.service_description && (
                      <p className="text-xs text-neutral-600 mt-1 whitespace-pre-line">
                        {invoice.service_description}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-neutral-900 text-right">
                    $ {formatMoney(invoice.service_price)}
                  </p>
                </div>
                <div className="px-4 py-3 border-t border-neutral-200 grid grid-cols-[1fr_140px] bg-neutral-50">
                  <span className="text-xs uppercase tracking-widest text-neutral-600">
                    Total
                  </span>
                  <span className="text-sm font-bold text-neutral-900 text-right">
                    $ {formatMoney(invoice.service_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment details */}
            {(invoice.swift_code || invoice.iban_code) && (
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  Payment details
                </p>
                <div className="grid grid-cols-2 gap-6 text-xs text-neutral-700">
                  {invoice.swift_code && (
                    <p>
                      <span className="font-semibold">SWIFT / BIC: </span>
                      {invoice.swift_code}
                    </p>
                  )}
                  {invoice.iban_code && (
                    <p>
                      <span className="font-semibold">IBAN: </span>
                      {invoice.iban_code}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="mt-12 text-[10px] text-neutral-400 text-center">
              Thank you for your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
        {label}
      </p>
      <p
        className={
          emphasized
            ? "text-lg font-bold text-purple-700"
            : "text-sm font-semibold text-neutral-900"
        }
      >
        {value}
      </p>
    </div>
  );
}
