"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import type { Invoice } from "@/types/docs";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import {
  createInvoice,
  updateInvoice,
  aiFillInvoiceFromFeedback,
  type InvoicePayload,
} from "../actions";

const CURRENCIES = ["$", "€", "£", "¥", "₹", "R$"];

/** Compose legacy swift/iban into the merged account-details text (edit fallback). */
function legacyAccountDetails(inv: Invoice | null): string {
  if (!inv) return "";
  if (inv.account_details) return inv.account_details;
  const lines: string[] = [];
  if (inv.swift_code) lines.push(`SWIFT / BIC: ${inv.swift_code}`);
  if (inv.iban_code) lines.push(`IBAN: ${inv.iban_code}`);
  return lines.join("\n");
}

/** INV-ddmmyyyy-AB12 (2 uppercase letters + 2 digits). */
function defaultCode() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const letters = Array.from({ length: 2 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");
  const digits = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `INV-${d}${m}${y}-${letters}${digits}`;
}

/** Returns the upcoming Friday (or today if today IS Friday) as ISO yyyy-mm-dd. */
function upcomingFriday(): string {
  const now = new Date();
  const daysToAdd = (5 - now.getDay() + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToAdd);
  return friday.toISOString().slice(0, 10);
}

interface Props {
  invoice: Invoice | null;
  lastInvoice?: Invoice | null;
  onClose: () => void;
}

export default function InvoiceFormModal({ invoice, lastInvoice, onClose }: Props) {
  const router = useRouter();
  const isEdit = invoice !== null;
  const [saving, startSave] = useTransition();

  // For new invoices: copy most fields from lastInvoice, but reset period/description.
  const prev = isEdit ? null : (lastInvoice ?? null);

  const [code, setCode]                             = useState(invoice?.code ?? defaultCode());
  const [companyOrUser, setCompanyOrUser]           = useState(invoice?.company_or_user_name ?? prev?.company_or_user_name ?? "");
  const [documentNumber, setDocumentNumber]         = useState(invoice?.document_number ?? prev?.document_number ?? "");
  const [address, setAddress]                       = useState(invoice?.address ?? prev?.address ?? "");
  const [phone, setPhone]                           = useState(invoice?.phone ?? prev?.phone ?? "");
  const [email, setEmail]                           = useState(invoice?.email ?? prev?.email ?? "");
  const [clientName, setClientName]                 = useState(invoice?.client_name ?? prev?.client_name ?? "");
  const [servicePrice, setServicePrice]             = useState<string>(
    invoice?.service_price !== null && invoice?.service_price !== undefined
      ? String(invoice.service_price)
      : prev?.service_price !== null && prev?.service_price !== undefined
        ? String(prev.service_price)
        : ""
  );
  const [currency, setCurrency]                     = useState(invoice?.currency ?? prev?.currency ?? "$");
  const [dueDate, setDueDate]                       = useState<string>(invoice?.due_date ?? upcomingFriday());
  const [serviceTitle, setServiceTitle]             = useState(invoice?.service_title ?? prev?.service_title ?? "");
  // Period + description always start empty for new invoices
  const [startDate, setStartDate]                   = useState<string>(invoice?.start_date ?? "");
  const [endDate, setEndDate]                       = useState<string>(invoice?.end_date ?? "");
  const [totalTime, setTotalTime]                   = useState<string>(
    invoice?.total_time !== null && invoice?.total_time !== undefined
      ? String(invoice.total_time)
      : ""
  );
  const serviceDescRef = useRef<RichTextEditorHandle>(null);
  const [accountDetails, setAccountDetails]         = useState(legacyAccountDetails(invoice) || legacyAccountDetails(prev));
  const [aiFilling, setAiFilling] = useState(false);
  const [aiFillError, setAiFillError] = useState<string | null>(null);

  async function handleAiFill() {
    setAiFillError(null);
    if (!startDate || !endDate) {
      setAiFillError("Please fill the start date and end date inputs first.");
      return;
    }
    setAiFilling(true);
    try {
      const res = await aiFillInvoiceFromFeedback({ startDate, endDate });
      if (res.totalTime !== undefined) setTotalTime(String(res.totalTime));
      if (res.serviceDescription) serviceDescRef.current?.setContent(res.serviceDescription);
      if (res.error) setAiFillError(res.error);
    } finally {
      setAiFilling(false);
    }
  }

  function handleSave() {
    const trimmedCode = code.trim();
    if (!trimmedCode)                { alert("Invoice code is required."); return; }
    if (!companyOrUser.trim())       { alert("Company / user name is required."); return; }
    if (!documentNumber.trim())      { alert("Document number is required."); return; }
    if (!address.trim())             { alert("Address is required."); return; }
    if (!phone.trim())               { alert("Phone is required."); return; }
    if (!email.trim())               { alert("Email is required."); return; }
    if (!clientName.trim())          { alert("Client name is required."); return; }
    if (!serviceTitle.trim())        { alert("Service title is required."); return; }
    if (!dueDate)                    { alert("Due date is required."); return; }
    if (!accountDetails.trim())      { alert("Account details are required."); return; }

    const priceNum = servicePrice.trim() === "" ? null : Number(servicePrice);
    if (priceNum === null)            { alert("Service price is required."); return; }
    if (Number.isNaN(priceNum))       { alert("Service price must be a valid number."); return; }

    const totalNum = totalTime.trim() === "" ? null : Number(totalTime);
    if (totalNum !== null && (Number.isNaN(totalNum) || totalNum < 0)) {
      alert("Total time must be a non-negative number."); return;
    }
    if (startDate && endDate && startDate > endDate) {
      alert("Start date must be on or before end date."); return;
    }

    const descHtml = serviceDescRef.current?.getHTML() ?? "";
    const serviceDescription = descHtml.replace(/<[^>]*>/g, "").trim() ? descHtml : null;

    const payload: InvoicePayload = {
      code: trimmedCode,
      company_or_user_name: companyOrUser.trim() || null,
      document_number:      documentNumber.trim() || null,
      address:              address.trim() || null,
      phone:                phone.trim() || null,
      email:                email.trim() || null,
      client_name:          clientName.trim() || null,
      service_price:        priceNum,
      currency:             currency || null,
      due_date:             dueDate || null,
      service_title:        serviceTitle.trim() || null,
      service_description:  serviceDescription,
      account_details:      accountDetails.trim() || null,
      start_date:           startDate || null,
      end_date:             endDate || null,
      total_time:           totalNum,
    };

    startSave(async () => {
      const res = isEdit
        ? await updateInvoice(invoice!.id, payload)
        : await createInvoice(payload);
      if (res.error) { alert(res.error); return; }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">
            {isEdit ? "Edit invoice" : "New invoice"}
          </h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* INVOICE */}
          <section>
            <SectionTitle>Invoice</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Code *">
                <TextInput value={code} onChange={setCode} placeholder="INV-19062026-AB12" required />
              </Field>
              <Field label="Due date *">
                <DatePicker value={dueDate} onChange={setDueDate} size="compact" />
              </Field>
            </div>
          </section>

          {/* ISSUER */}
          <section>
            <SectionTitle>Issuer (you)</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Company or user name *">
                <TextInput value={companyOrUser} onChange={setCompanyOrUser} placeholder="Move37 Ltd" required />
              </Field>
              <Field label="Document number *">
                <TextInput value={documentNumber} onChange={setDocumentNumber} placeholder="EIN / CPF / VAT" required />
              </Field>
              <Field label="Address *">
                <TextInput value={address} onChange={setAddress} placeholder="Street, City, State, ZIP" required />
              </Field>
              <Field label="Phone *">
                <TextInput value={phone} onChange={setPhone} placeholder="+1 555 0100" required />
              </Field>
              <Field label="Email *">
                <TextInput value={email} onChange={setEmail} type="email" placeholder="billing@example.com" required />
              </Field>
            </div>
          </section>

          {/* CLIENT */}
          <section>
            <SectionTitle>Client</SectionTitle>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Client name *">
                <TextInput value={clientName} onChange={setClientName} placeholder="Acme Co." required />
              </Field>
            </div>
          </section>

          {/* SERVICE */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Service
              </h4>
              <button
                type="button"
                onClick={handleAiFill}
                disabled={aiFilling}
                title="Fill total time worked and service description from your work feedback in this date range"
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4" />
                  <path d="M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z" />
                </svg>
                {aiFilling ? "Filling…" : "AI Fill"}
              </button>
            </div>

            {/* Service title + Currency + Price */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_140px] gap-3 mb-3">
              <Field label="Service title *">
                <TextInput value={serviceTitle} onChange={setServiceTitle} placeholder="Web app development" required />
              </Field>
              <Field label="Currency *">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Service price *">
                <TextInput value={servicePrice} onChange={setServicePrice} type="number" placeholder="1500.00" required />
              </Field>
            </div>

            {/* Work period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field label="Start date">
                <DatePicker value={startDate} onChange={(v) => { setStartDate(v); setAiFillError(null); }} size="compact" />
              </Field>
              <Field label="End date">
                <DatePicker value={endDate} onChange={(v) => { setEndDate(v); setAiFillError(null); }} size="compact" minDate={startDate || undefined} />
              </Field>
              <Field label="Total time worked (h)">
                <TextInput value={totalTime} onChange={setTotalTime} type="number" placeholder="0" />
              </Field>
            </div>

            {/* AI Fill inline error */}
            {aiFillError && (
              <p className="text-xs text-red-500 mb-3">{aiFillError}</p>
            )}

            {/* Service description */}
            <div className="md:col-span-2">
              <Field label="Service description *">
                <div className="border border-border rounded-md overflow-hidden bg-muted/30">
                  <RichTextEditor
                    ref={serviceDescRef}
                    initialHtml={invoice?.service_description ?? ""}
                    hideFooter
                    autoHeight
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* PAYMENT DETAILS */}
          <section>
            <SectionTitle>Payment details</SectionTitle>
            <Field label="Account details (SWIFT / BIC, IBAN, Wise Code, etc.) *">
              <textarea
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                rows={3}
                required
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                placeholder={"SWIFT / BIC: CHASUS33\nIBAN: DE89 3704 0044 0532 0130 00\nWise: ..."}
              />
            </Field>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">{children}</h4>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", required = false }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
    />
  );
}
