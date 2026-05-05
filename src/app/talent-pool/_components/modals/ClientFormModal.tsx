"use client";

/**
 * Quick-create modal for a Client (the client-side endorser of a talent).
 * Stacked on top of TalentFormModal at z=60.
 */

import { useState, useTransition } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { createClientProfile } from "../../actions";
import { COUNTRIES } from "@/types/talent";
import AvatarUpload from "../AvatarUpload";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (client: { id: string; name: string | null; picture: string | null }) => void;
}

export default function ClientFormModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setName(""); setCountry(""); setEmail(""); setPhone("");
    setLinkedin(""); setPicture(null); setError(null);
  }
  function handleClose() { reset(); onClose(); }

  function save() {
    setError(null);
    if (!name.trim()) { setError("Full name is required."); return; }
    start(async () => {
      const r = await createClientProfile({
        name: name.trim(),
        country: country || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin: linkedin.trim() || null,
        picture,
      });
      if (r.error) { setError(r.error); return; }
      if (r.client) { onCreated(r.client); reset(); }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Client Profile" width="max-w-lg" zIndex={60}>
      <div className="px-6 pb-2 space-y-4">
        <div className="flex justify-center">
          <AvatarUpload value={picture} onChange={setPicture} />
        </div>

        <Field label="Full Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Country">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-field">
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
          </Field>
          <Field label="LinkedIn">
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/…" />
          </Field>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
        <button onClick={handleClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">Close</button>
        <button onClick={save} disabled={pending} className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50">
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
