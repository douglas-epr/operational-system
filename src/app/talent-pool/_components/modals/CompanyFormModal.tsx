"use client";

/**
 * Quick-create modal for a Company. Stacked on top of TalentFormModal
 * (z=60) and on top of RecommenderFormModal-on-top-of-Talent (z=70).
 */

import { useState, useTransition } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { createCompanyAction } from "../../actions";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (company: { id: string; name: string }) => void;
  /** 60 if stacked on top of TalentFormModal, 70 if on Recommender too. */
  zIndex?: 60 | 70;
}

export default function CompanyFormModal({ open, onClose, onCreated, zIndex = 60 }: Props) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setName("");
    setWebsite("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function save() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    start(async () => {
      const r = await createCompanyAction({
        name: name.trim(),
        website: website.trim() || null,
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.company) {
        onCreated(r.company);
        reset();
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Company" width="max-w-md" zIndex={zIndex}>
      <div className="px-6 pb-2 space-y-4">
        <Field label="Name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Company name"
          />
        </Field>
        <Field label="Website">
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="input-field"
            placeholder="https://…"
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
        <button onClick={handleClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
          Close
        </button>
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
