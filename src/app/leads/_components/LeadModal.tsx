"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/projects/_components/modals/Modal";
import AvatarUpload from "@/app/talent-pool/_components/AvatarUpload";
import { COUNTRIES } from "@/types/talent";
import type { Lead } from "@/types/leads";
import { createLead, updateLead } from "../actions";

interface Props {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export default function LeadModal({ open, lead, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!lead;
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(lead?.name ?? "");
    setCountry(lead?.country ?? "");
    setEmail(lead?.email ?? "");
    setPhone(lead?.phone ?? "");
    setLinkedin(lead?.linkedin ?? "");
    setPicture(lead?.picture ?? null);
    setError(null);
  }, [open, lead]);

  function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    start(async () => {
      const payload = {
        name: name.trim(),
        country: country || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin: linkedin.trim() || null,
        picture,
      };
      const r = isEdit
        ? await updateLead(lead!.id, payload)
        : await createLead(payload);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Lead Profile" : "Create Lead Profile"}
      width="max-w-2xl"
    >
      <div className="px-6 pb-2 space-y-4">
        <div className="flex justify-center pt-2">
          <AvatarUpload value={picture} onChange={setPicture} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="input-field"
            />
          </Field>
          <Field label="Country">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input-field"
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="johndoe@gmail.com"
              className="input-field"
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 919-555-8247"
              className="input-field"
            />
          </Field>
        </div>

        <Field label="LinkedIn">
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="www.linkedin.com/in/john-doe-8ab87824/"
            className="input-field"
          />
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors"
        >
          Close
        </button>
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-8 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {pending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
        </button>
      </div>
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
