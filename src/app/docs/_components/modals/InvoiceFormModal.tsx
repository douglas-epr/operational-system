"use client";

/**
 * Create / edit an invoice for a project.
 * Persists to `project_invoice` via createProjectInvoice /
 * updateProjectInvoice. Follows the same modal shell as the other Docs tabs.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import type { Project } from "@/types/projects";
import type { ProjectInvoice } from "@/types/docs";
import {
  createProjectInvoice,
  updateProjectInvoice,
  type InvoicePayload,
} from "../../actions";

interface Props {
  project: Project;
  invoice: ProjectInvoice | null;
  onClose: () => void;
}

function defaultCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

export default function InvoiceFormModal({ project, invoice, onClose }: Props) {
  const router = useRouter();
  const isEdit = invoice !== null;
  const [saving, startSave] = useTransition();

  const [code, setCode]                       = useState(invoice?.code ?? defaultCode());
  const [companyOrUser, setCompanyOrUser]     = useState(invoice?.company_or_user_name ?? "");
  const [documentNumber, setDocumentNumber]   = useState(invoice?.document_number ?? "");
  const [address, setAddress]                 = useState(invoice?.address ?? "");
  const [phone, setPhone]                     = useState(invoice?.phone ?? "");
  const [email, setEmail]                     = useState(invoice?.email ?? "");
  const [clientName, setClientName]           = useState(invoice?.client_name ?? "");
  const [servicePrice, setServicePrice]       = useState<string>(
    invoice?.service_price !== null && invoice?.service_price !== undefined
      ? String(invoice.service_price)
      : ""
  );
  const [dueDate, setDueDate]                 = useState<string>(invoice?.due_date ?? "");
  const [serviceTitle, setServiceTitle]       = useState(invoice?.service_title ?? "");
  const [serviceDescription, setServiceDescription] = useState(invoice?.service_description ?? "");
  const [swiftCode, setSwiftCode]             = useState(invoice?.swift_code ?? "");
  const [ibanCode, setIbanCode]               = useState(invoice?.iban_code ?? "");

  function handleSave() {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      alert("Invoice code is required.");
      return;
    }
    const priceNum = servicePrice.trim() === "" ? null : Number(servicePrice);
    if (priceNum !== null && Number.isNaN(priceNum)) {
      alert("Service price must be a number.");
      return;
    }

    const payload: InvoicePayload = {
      code: trimmedCode,
      company_or_user_name: companyOrUser.trim() || null,
      document_number:      documentNumber.trim() || null,
      address:              address.trim() || null,
      phone:                phone.trim() || null,
      email:                email.trim() || null,
      client_name:          clientName.trim() || null,
      service_price:        priceNum,
      due_date:             dueDate || null,
      service_title:        serviceTitle.trim() || null,
      service_description:  serviceDescription.trim() || null,
      swift_code:           swiftCode.trim() || null,
      iban_code:            ibanCode.trim() || null,
    };

    startSave(async () => {
      const res = isEdit
        ? await updateProjectInvoice(invoice!.id, payload)
        : await createProjectInvoice({ projectId: project.id, data: payload });
      if (res.error) {
        alert(res.error);
        return;
      }
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
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Invoice meta */}
          <section>
            <SectionTitle>Invoice</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Code *">
                <TextInput value={code} onChange={setCode} placeholder="INV-2026-0001" />
              </Field>
              <Field label="Due date">
                <DatePicker value={dueDate} onChange={setDueDate} size="compact" />
              </Field>
            </div>
          </section>

          {/* Issuer */}
          <section>
            <SectionTitle>Issuer (you)</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Company or user name">
                <TextInput value={companyOrUser} onChange={setCompanyOrUser} placeholder="Blur Studio LLC" />
              </Field>
              <Field label="Document number">
                <TextInput value={documentNumber} onChange={setDocumentNumber} placeholder="EIN / CPF / VAT" />
              </Field>
              <Field label="Address">
                <TextInput value={address} onChange={setAddress} placeholder="Street, City, State, ZIP" />
              </Field>
              <Field label="Phone">
                <TextInput value={phone} onChange={setPhone} placeholder="+1 555 0100" />
              </Field>
              <Field label="Email">
                <TextInput value={email} onChange={setEmail} type="email" placeholder="billing@example.com" />
              </Field>
            </div>
          </section>

          {/* Client */}
          <section>
            <SectionTitle>Client</SectionTitle>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Client name">
                <TextInput value={clientName} onChange={setClientName} placeholder="Acme Co." />
              </Field>
            </div>
          </section>

          {/* Service */}
          <section>
            <SectionTitle>Service</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Service title">
                <TextInput value={serviceTitle} onChange={setServiceTitle} placeholder="Web app development" />
              </Field>
              <Field label="Service price">
                <TextInput value={servicePrice} onChange={setServicePrice} type="number" placeholder="1500.00" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Service description">
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    placeholder="Milestones, scope notes, etc."
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <SectionTitle>Payment details</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="SWIFT / BIC">
                <TextInput value={swiftCode} onChange={setSwiftCode} placeholder="CHASUS33" />
              </Field>
              <Field label="IBAN">
                <TextInput value={ibanCode} onChange={setIbanCode} placeholder="DE89 3704 0044 0532 0130 00" />
              </Field>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5"
          >
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

// ── helpers ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
      {children}
    </h4>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
    />
  );
}
