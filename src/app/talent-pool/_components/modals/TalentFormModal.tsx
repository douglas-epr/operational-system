"use client";

/**
 * Create / edit modal for a Talent — the master form for the Talent Pool.
 *
 * Stacking layers:
 *   - this modal       z-50
 *   - Company / Client / Recommender child modals z-60
 *   - Recommender → Company nested grandchild     z-70
 *
 * On save we call createTalent / updateTalent server actions which
 * also sync the join tables (talent_tool, talent_programming_language,
 * talent_referred_by, client_who_referred_this_talent).
 */

import { useEffect, useState, useTransition } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import {
  createTalent,
  updateTalent,
  searchCompaniesAction,
  searchTalents,
  searchClientsAction,
} from "../../actions";
import {
  COUNTRIES,
  TOOL_LABELS,
  PROGRAMMING_LANGUAGE_LABELS,
} from "@/types/talent";
import type {
  TalentInput,
  TalentRow,
  Tool,
  ProgrammingLanguage,
} from "@/types/talent";
import { TALENT_LEVEL_LABELS, TALENT_AUTHORITY_LEVEL_LABELS } from "@/types/projects";
import type { TalentLevel, TalentAuthorityLevel } from "@/types/projects";
import AvatarUpload from "../AvatarUpload";
import TypeaheadPicker from "../TypeaheadPicker";
import type { PickerItem } from "../TypeaheadPicker";
import TypeaheadMultiPicker from "../TypeaheadMultiPicker";
import SkillRowsEditor from "../SkillRowsEditor";
import CompanyFormModal from "./CompanyFormModal";
import RecommenderFormModal from "./RecommenderFormModal";
import ClientFormModal from "./ClientFormModal";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing talent for edit mode; undefined → create mode. */
  talent?: TalentRow;
  /** Lookup map: id → company {name} for hydrating the picker */
  companies: { id: string; name: string }[];
  /** Lookup map: id → talent {name, picture} for hydrating recommender chips */
  talents: { id: string; name: string | null; picture: string | null }[];
  /** Lookup map: id → client {name, picture} for hydrating client-referrer chips */
  clients: { id: string; name: string | null; picture: string | null }[];
  onSaved: () => void;
}

export default function TalentFormModal({
  open,
  onClose,
  talent,
  companies,
  talents,
  clients,
  onSaved,
}: Props) {
  const isEdit = !!talent;

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [job, setJob] = useState("");
  const [level, setLevel] = useState<TalentLevel | "">("");
  const [authority, setAuthority] = useState<TalentAuthorityLevel | "">("");
  const [company, setCompany] = useState<PickerItem | null>(null);

  const [tools, setTools] = useState<{ key: string; score: number | null }[]>([]);
  const [langs, setLangs] = useState<{ key: string; score: number | null }[]>([]);
  const [recommenders, setRecommenders] = useState<PickerItem[]>([]);
  const [clientReferrers, setClientReferrers] = useState<PickerItem[]>([]);

  const [companyOpen, setCompanyOpen] = useState(false);
  const [recommenderOpen, setRecommenderOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Hydrate from `talent` whenever the modal opens with an edit target.
  useEffect(() => {
    if (!open) return;
    if (talent) {
      setName(talent.name ?? "");
      setCountry(talent.country ?? "");
      setEmail(talent.email ?? "");
      setPhone(talent.phone ?? "");
      setLinkedin(talent.linkedin ?? "");
      setPortfolio(talent.portfolio ?? "");
      setPicture(talent.picture ?? null);
      setJob(talent.current_job_position ?? "");
      setLevel(talent.level ?? "");
      setAuthority(talent.authority_level ?? "");

      const c = companies.find((x) => x.id === talent.current_company_id);
      setCompany(c ? { id: c.id, label: c.name } : null);

      setTools(talent.tools.map((t) => ({ key: t.tool, score: t.score })));
      setLangs(
        talent.programming_languages.map((l) => ({
          key: l.language,
          score: l.score,
        }))
      );
      setRecommenders(
        talent.recommender_ids
          .map((id) => talents.find((t) => t.id === id))
          .filter((t): t is { id: string; name: string | null; picture: string | null } => !!t)
          .map((t) => ({
            id: t.id,
            label: t.name ?? "(no name)",
            picture: t.picture,
          }))
      );
      setClientReferrers(
        talent.client_referrer_ids
          .map((id) => clients.find((c) => c.id === id))
          .filter((c): c is { id: string; name: string | null; picture: string | null } => !!c)
          .map((c) => ({
            id: c.id,
            label: c.name ?? "(no name)",
            picture: c.picture,
          }))
      );
    } else {
      setName(""); setCountry(""); setEmail(""); setPhone("");
      setLinkedin(""); setPortfolio(""); setPicture(null); setJob("");
      setLevel(""); setAuthority(""); setCompany(null);
      setTools([]); setLangs([]); setRecommenders([]); setClientReferrers([]);
    }
    setError(null);
  }, [open, talent, companies, talents, clients]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function searchCompaniesFn(q: string): Promise<PickerItem[]> {
    const list = await searchCompaniesAction(q);
    return list.map((c) => ({ id: c.id, label: c.name }));
  }
  async function searchTalentsFn(q: string): Promise<PickerItem[]> {
    const list = await searchTalents(q);
    return list
      .filter((t) => !talent || t.id !== talent.id)
      .map((t) => ({ id: t.id, label: t.name ?? "(no name)", picture: t.picture }));
  }
  async function searchClientsFn(q: string): Promise<PickerItem[]> {
    const list = await searchClientsAction(q);
    return list.map((c) => ({ id: c.id, label: c.name ?? "(no name)", picture: c.picture }));
  }

  function save() {
    setError(null);
    if (!name.trim()) { setError("Full name is required."); return; }

    const input: TalentInput = {
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
      tools: tools
        .filter((t) => t.key)
        .map((t) => ({ tool: t.key as Tool, score: t.score })),
      programming_languages: langs
        .filter((l) => l.key)
        .map((l) => ({ language: l.key as ProgrammingLanguage, score: l.score })),
      recommender_ids: recommenders.map((r) => r.id),
      client_referrer_ids: clientReferrers.map((c) => c.id),
    };

    start(async () => {
      const r = isEdit
        ? await updateTalent(talent!.id, input)
        : await createTalent(input);
      if (r.error) { setError(r.error); return; }
      onSaved();
    });
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} title={isEdit ? "Edit Talent" : "Create Talent"} width="max-w-4xl" zIndex={50}>
        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-2 space-y-5">
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
                search={searchCompaniesFn}
                placeholder="Search company…"
                footer={
                  <button type="button" onClick={() => setCompanyOpen(true)} className="text-xs text-accent hover:underline">
                    Didn&apos;t find the company? Create one now →
                  </button>
                }
              />
            </Field>
          </div>

          {/* Tools */}
          <Section title="Tools">
            <SkillRowsEditor
              rows={tools}
              onChange={setTools}
              options={Object.entries(TOOL_LABELS).map(([value, label]) => ({ value, label }))}
              itemLabel="Tool"
              addLabel="+ Add tool"
            />
          </Section>

          {/* Programming Languages */}
          <Section title="Programming Languages">
            <SkillRowsEditor
              rows={langs}
              onChange={setLangs}
              options={Object.entries(PROGRAMMING_LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))}
              itemLabel="Language"
              addLabel="+ Add language"
            />
          </Section>

          {/* Recommenders */}
          <Section title="Devs or Agency Owners who recommend this talent">
            <TypeaheadMultiPicker
              values={recommenders}
              onChange={setRecommenders}
              search={searchTalentsFn}
              placeholder="Search talent…"
              footer={
                <button type="button" onClick={() => setRecommenderOpen(true)} className="text-xs text-accent hover:underline">
                  Didn&apos;t find the Dev or Agency Owner to recommend you? Create one now →
                </button>
              }
            />
          </Section>

          {/* Client referrers */}
          <Section title="Clients who recommend this talent">
            <TypeaheadMultiPicker
              values={clientReferrers}
              onChange={setClientReferrers}
              search={searchClientsFn}
              placeholder="Search client…"
              footer={
                <button type="button" onClick={() => setClientOpen(true)} className="text-xs text-accent hover:underline">
                  Didn&apos;t find the client to recommend you? Create one now →
                </button>
              }
            />
          </Section>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button onClick={handleClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">Close</button>
          <button onClick={save} disabled={pending} className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50">
            {pending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create")}
          </button>
        </div>
      </Modal>

      <CompanyFormModal
        open={companyOpen}
        onClose={() => setCompanyOpen(false)}
        zIndex={60}
        onCreated={(c) => {
          setCompany({ id: c.id, label: c.name });
          setCompanyOpen(false);
        }}
      />
      <RecommenderFormModal
        open={recommenderOpen}
        onClose={() => setRecommenderOpen(false)}
        onCreated={(r) => {
          setRecommenders((prev) =>
            prev.some((p) => p.id === r.id)
              ? prev
              : [...prev, { id: r.id, label: r.name ?? "(no name)", picture: r.picture }]
          );
          setRecommenderOpen(false);
        }}
      />
      <ClientFormModal
        open={clientOpen}
        onClose={() => setClientOpen(false)}
        onCreated={(c) => {
          setClientReferrers((prev) =>
            prev.some((p) => p.id === c.id)
              ? prev
              : [...prev, { id: c.id, label: c.name ?? "(no name)", picture: c.picture }]
          );
          setClientOpen(false);
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      {children}
    </div>
  );
}
