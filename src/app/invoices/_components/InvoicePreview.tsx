"use client";

import type { Invoice } from "@/types/docs";

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

function formatMoney(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function InvoicePreview({ invoice, onClose }: Props) {
  const issueDate = new Date(invoice.created_at).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });

  // Prefer the merged account-details field; fall back to legacy swift/iban.
  const legacyPayment = [
    invoice.swift_code ? `SWIFT / BIC: ${invoice.swift_code}` : null,
    invoice.iban_code ? `IBAN: ${invoice.iban_code}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const paymentDetails = invoice.account_details || legacyPayment;

  const periodLabel =
    invoice.start_date && invoice.end_date
      ? `${formatDate(invoice.start_date)} – ${formatDate(invoice.end_date)}`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 invoice-preview-backdrop"
      onClick={onClose}
    >
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-printable, .invoice-printable * { visibility: visible !important; }
          .invoice-printable {
            position: absolute !important; left: 0; top: 0;
            width: 100%; padding: 32px !important; box-shadow: none !important;
          }
          .invoice-preview-backdrop { background: white !important; }
          .invoice-no-print { display: none !important; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-neutral-900 w-full max-w-3xl max-h-[92vh] rounded-lg shadow-xl flex flex-col overflow-hidden"
      >
        <div className="invoice-no-print flex items-center justify-between px-5 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-700">Invoice preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
            >
              Download (Print → Save as PDF)
            </button>
            <button onClick={onClose} className="text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5">
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="invoice-printable bg-white p-10">
            <div className="flex items-center justify-between pb-6 border-b-4 border-purple-600">
              <div>
                <p className="text-4xl font-black tracking-widest text-purple-700">INVOICE</p>
                <p className="text-xs text-neutral-500 mt-1">#{invoice.code}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500">Issued by</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {invoice.company_or_user_name ?? "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">From</p>
                <p className="text-sm font-semibold text-neutral-900">{invoice.company_or_user_name ?? "—"}</p>
                {invoice.document_number && <p className="text-xs text-neutral-600">ID: {invoice.document_number}</p>}
                {invoice.address && <p className="text-xs text-neutral-600 whitespace-pre-line">{invoice.address}</p>}
                {invoice.phone && <p className="text-xs text-neutral-600">{invoice.phone}</p>}
                {invoice.email && <p className="text-xs text-neutral-600">{invoice.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Invoice to</p>
                <p className="text-sm font-semibold text-neutral-900">{invoice.client_name ?? "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">
              <InfoBlock label="Issue Date" value={issueDate} />
              <InfoBlock label="Due Date" value={formatDate(invoice.due_date)} />
              <InfoBlock label="Amount Payable" value={`$ ${formatMoney(invoice.service_price)}`} emphasized />
            </div>

            <div className="mt-10">
              <div className="bg-purple-700 text-white px-4 py-2 grid grid-cols-[1fr_140px] text-[11px] uppercase tracking-widest">
                <span>Service</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="border border-t-0 border-neutral-200">
                <div className="px-4 py-3 grid grid-cols-[1fr_140px]">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{invoice.service_title ?? "—"}</p>
                    {(periodLabel || invoice.total_time != null) && (
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {periodLabel}
                        {periodLabel && invoice.total_time != null ? " · " : ""}
                        {invoice.total_time != null ? `${invoice.total_time}h worked` : ""}
                      </p>
                    )}
                    {invoice.service_description && (
                      <p className="text-xs text-neutral-600 mt-1 whitespace-pre-line">{invoice.service_description}</p>
                    )}
                  </div>
                  <p className="text-sm text-neutral-900 text-right">$ {formatMoney(invoice.service_price)}</p>
                </div>
                <div className="px-4 py-3 border-t border-neutral-200 grid grid-cols-[1fr_140px] bg-neutral-50">
                  <span className="text-xs uppercase tracking-widest text-neutral-600">Total</span>
                  <span className="text-sm font-bold text-neutral-900 text-right">$ {formatMoney(invoice.service_price)}</span>
                </div>
              </div>
            </div>

            {paymentDetails && (
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Payment details</p>
                <p className="text-xs text-neutral-700 whitespace-pre-line">{paymentDetails}</p>
              </div>
            )}

            <p className="mt-12 text-[10px] text-neutral-400 text-center">Thank you for your business.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
      <p className={emphasized ? "text-lg font-bold text-purple-700" : "text-sm font-semibold text-neutral-900"}>
        {value}
      </p>
    </div>
  );
}
