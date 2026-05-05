"use client";

/**
 * Public self-edit form, rendered at /talent-profile?code=<token>.
 *
 * No authentication: all writes go through `update_talent_by_code` and
 * `uploadTalentAvatarByCode`, which re-validate the share token in the
 * database before doing anything.
 *
 * Recommender / client-referrer joins are intentionally NOT editable
 * here — only the staff-side TalentFormModal can edit those.
 */

import { useState, useTransition } from "react";
import {
  COUNTRIES,
  TOOL_LABELS,
  PROGRAMMING_LANGUAGE_LABELS,
} from "@/types/talent";
import { TALENT_LEVEL_LABELS, TALENT_AUTHORITY_LEVEL_LABELS } from "@/types/projects";
import type { TalentLevel, TalentAuthorityLevel } from "@/types/projects";
import SkillRowsEditor from "@/app/talent-pool/_components/SkillRowsEditor";
import {
  updateTalentByCode,
  uploadTalentAvatarByCode,
  type TalentByCode,
} from "../actions";

interface Props {
  code: string;
  initial: TalentByCode;
}

export default function TalentSelfEditForm({ code, initial }: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [linkedin, setLinkedin] = useState(initial.linkedin ?? "");
  const [portfolio, setPortfolio] = useState(initial.portfolio ?? "");
  const [picture, setPicture] = useState<string | null>(initial.picture);
  const [job, setJob] = useState(initial.current_job_position ?? "");
  const [level, setLevel] = useState<TalentLevel | "">(
    (initial.level as TalentLevel) ?? ""
  );
  const [authority, setAuthority] = useState<TalentAuthorityLevel | "">(
    (initial.authority_level as TalentAuthorityLevel) ?? ""
  );

  const [tools, setTools] = useState<{ key: string; score: number | null }[]>(
    initial.tools.map((t) => ({ key: t.tool, score: t.score }))
  );
  const [langs, setLangs] = useState<{ key: string; score: number | null }[]>(
    initial.programming_languages.map((l) => ({
      key: l.language,
      score: l.score,
    }))
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const bytesBase64 = arrayBufferToBase64(buf);
      const r = await uploadTalentAvatarByCode(code, {
        name: file.name,
        type: file.type,
        bytesBase64,
      });
      if (r.error) { setError(r.error); return; }
      if (r.url) setPicture(r.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function save() {
    setError(null);
    setSuccess(false);
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      linkedin: linkedin.trim() || null,
      portfolio: portfolio.trim() || null,
      picture,
      country: country || null,
      current_job_position: job.trim() || null,
      level: level || null,
      authority_level: authority || null,
      tools: tools
        .filter((t) => t.key)
        .map((t) => ({ tool: t.key, score: t.score })),
      programming_languages: langs
        .filter((l) => l.key)
        .map((l) => ({ language: l.key, score: l.score })),
    };

    start(async () => {
      const r = await updateTalentByCode(code, payload);
      if (r.error) { setError(r.error); return; }
      setSuccess(true);
    });
  }

  return (
    <div className="bg-elevated border border-border rounded-xl p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Your profile</h1>
        <p className="text-xs text-text-secondary mt-1">
          Update your details below. Changes save immediately when you click
          Save.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center">
        <label className="cursor-pointer">
          <div className="w-28 h-28 rounded-full border-2 border-dashed border-border hover:border-accent flex items-center justify-center overflow-hidden transition-colors relative group">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picture} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-text-muted">+ Photo</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <span className="text-white text-[11px]">{uploading ? "Uploading…" : "Change"}</span>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </label>
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
          <input
            value={initial.current_company?.name ?? ""}
            disabled
            className="input-field opacity-60"
            placeholder="—"
            title="Only Blur Studio staff can change your current company."
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

      {/* Languages */}
      <Section title="Programming Languages">
        <SkillRowsEditor
          rows={langs}
          onChange={setLangs}
          options={Object.entries(PROGRAMMING_LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))}
          itemLabel="Language"
          addLabel="+ Add language"
        />
      </Section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">Saved.</p>}

      <div className="flex items-center justify-end pt-2 border-t border-border">
        <button
          onClick={save}
          disabled={pending}
          className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
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

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk))
    );
  }
  return btoa(binary);
}
