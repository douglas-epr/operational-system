"use client";

/**
 * Quick-create modal for a recommender talent (Dev or Agency Owner).
 * Same shape as the main TalentFormModal but minus the tools / programming
 * languages / recommenders join sections — recommenders are themselves
 * talents but we only collect their identity here.
 *
 * Stacked at z=60. Its own nested Company modal stacks at z=70.
 */

import { useState, useTransition } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { createRecommender, searchCompaniesAction } from "../../actions";
import { COUNTRIES } from "@/types/talent";
import { TALENT_LEVEL_LABELS, TALENT_AUTHORITY_LEVEL_LABELS } from "@/types/projects";
import type { TalentLevel, TalentAuthorityLevel } from "@/types/projects";
import AvatarUpload from "../AvatarUpload";
import TypeaheadPicker from "../TypeaheadPicker";
import type { PickerItem } from "../TypeaheadPicker";
import CompanyFormModal from "./CompanyFormModal";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (recommender: { id: string; name: string | null; picture: string | null }) => void;
}

export default function RecommenderFormModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [level, setLevel] = useState<TalentLevel | "">("");
  const [authority, setAuthority] = useState<TalentAuthorityLevel | "">("");
  const [job, setJob] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [company, setCompany] = useState<PickerItem | null>(null);
  const [companyOpen, setCompanyOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setName(""); setCountry(""); setEmail(""); setPhone(""); setLinkedin("");
    setPortfolio(""); setLevel(""); setAuthority(""); setJob("");
    setPicture(null); setCompany(null); setError(null);
  }
  function handleClose() { reset(); onClose(); }

  function save() {
    setError(null);
    if (!name.trim()) { setError("Full name is required."); return; }
    start(async () => {
      const r = await createRecommender({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin: linkedin.trim() || null,
        portfolio: portfolio.trim() || null,
        picture,
        country: country || null,
        current_job_position: job.trim() || null,
        level: (level || null) as TalentLevel | null,
        authority_level: (authority || null) as TalentAuthorityLevel | null,
        current_company_id: company?.id ?? null,
      });
      if (r.error) { setError(r.error); return; }
      if (r.recommender) { onCreated(r.recommender); reset(); }
    });
  }

  async function searchCompanies(q: string): Promise<PickerItem[]> {
    const list = await searchCompaniesAction(q);
    return list.map((c) => ({ id: c.id, label: c.name }));
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Create Dev or Agency Owner Profile" width="max-w-3xl" zIndex={60}>
        <div className="px-6 pb-2 space-y-4">
          <div className="flex justify-center">
            <AvatarUpload value={picture} onChange={setPicture} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </Field>
            <Field label="Country">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-field">
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
            </Field>

            <Field label="LinkedIn">
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="Portfolio">
              <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="input-field" placeholder="https://…" />
            </Field>

            <Field label="Level">
              <select value={level} onChange={(e) => setLevel(e.target.value as TalentLevel | "")} className="input-field">
                <option value="">Select level…</option>
                {Object.entries(TALENT_LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Authority Level">
              <select value={authority} onChange={(e) => setAuthority(e.target.value as TalentAuthorityLevel | "")} className="input-field">
                <option value="">Select…</option>
                {Object.entries(TALENT_AUTHORITY_LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Current Job Position">
              <input value={job} onChange={(e) => setJob(e.target.value)} className="input-field" />
            </Field>
            <Field label="Current Company">
              <TypeaheadPicker
                value={company}
                onChange={setCompany}
                search={searchCompanies}
                placeholder="Search company…"
                footer={
                  <button
                    type="button"
                    onClick={() => setCompanyOpen(true)}
                    className="text-xs text-accent hover:underline"
                  >
                    Didn&apos;t find the company? Create one now →
                  </button>
                }
              />
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

      <CompanyFormModal
        open={companyOpen}
        onClose={() => setCompanyOpen(false)}
        zIndex={70}
        onCreated={(c) => {
          setCompany({ id: c.id, label: c.name });
          setCompanyOpen(false);
        }}
      />
    </>
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
