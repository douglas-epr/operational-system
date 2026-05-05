"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import type { UserProfile } from "@/types/projects";
import type {
  AgreementTemplate,
  AgreementVersion,
  OsAgreementStatus,
} from "@/types/docs";
import { AGREEMENT_STATUS_LABELS } from "@/types/docs";
import { createAgreement, updateAgreement } from "../../actions";

interface Props {
  projectId: string;
  projectAuthorizedUsers: string[];
  profiles: UserProfile[];
  templates: AgreementTemplate[];
  agreement: AgreementVersion | null;
  onClose: () => void;
}

const STATUS_OPTIONS: OsAgreementStatus[] = [
  "not_available",
  "ready_to_sign",
  "completed",
  "archived",
];

export default function AgreementFormModal({
  projectId,
  projectAuthorizedUsers,
  profiles,
  templates,
  agreement,
  onClose,
}: Props) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [name, setName] = useState(agreement?.name ?? "");
  const [templateId, setTemplateId] = useState<string | null>(agreement?.type ?? null);
  const [status, setStatus] = useState<OsAgreementStatus>(agreement?.status ?? "not_available");
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>(
    agreement?.authorized_users ?? projectAuthorizedUsers
  );
  const [requiredSigners, setRequiredSigners] = useState<string[]>(
    agreement?.required_signers ?? []
  );
  const [googleDocsUrl, setGoogleDocsUrl] = useState(agreement?.google_docs_url ?? "");
  const [initialContent, setInitialContent] = useState(agreement?.content ?? "");

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function applyTemplate(id: string) {
    setTemplateId(id || null);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (!name.trim()) setName(t.name);
    // Replace editor content with template content
    const content = t.content ?? "";
    setInitialContent(content);
    editorRef.current?.setContent(content);
  }

  function handleSubmit() {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    // Required signers must be a subset of authorized_users
    const invalid = requiredSigners.filter((u) => !authorizedUsers.includes(u));
    if (invalid.length > 0) {
      alert("Required signers must also be authorized users.");
      return;
    }
    const content = editorRef.current?.getHTML() ?? "";
    startSave(async () => {
      const payload = {
        name: name.trim(),
        type: templateId,
        content,
        google_docs_url: googleDocsUrl.trim() || null,
        status,
        authorized_users: authorizedUsers,
        required_signers: requiredSigners,
      };
      const res = agreement
        ? await updateAgreement(agreement.id, payload)
        : await createAgreement({ projectId, ...payload });
      if (res.error) alert(res.error);
      else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg flex flex-col w-full max-w-5xl mx-auto overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text-primary">
            {agreement ? "Edit agreement" : "Create agreement"}
          </h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Left: metadata */}
          <aside className="w-[320px] shrink-0 border-r border-border overflow-y-auto p-5 flex flex-col gap-4">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </Field>

            <Field label="Template (optional)">
              <select
                value={templateId ?? ""}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OsAgreementStatus)}
                className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{AGREEMENT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>

            <Field label="Google Docs URL (optional)">
              <input
                value={googleDocsUrl}
                onChange={(e) => setGoogleDocsUrl(e.target.value)}
                placeholder="https://docs.google.com/…"
                className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </Field>

            <Field label="Authorized users">
              <UserCheckList
                profiles={profiles}
                value={authorizedUsers}
                onChange={setAuthorizedUsers}
              />
            </Field>

            <Field label="Required signers">
              <p className="text-[10px] text-text-muted mb-1">
                Status auto-flips to &ldquo;Completed&rdquo; when every required signer has signed.
              </p>
              <UserCheckList
                profiles={profiles.filter((p) => authorizedUsers.includes(p.id))}
                value={requiredSigners}
                onChange={setRequiredSigners}
              />
            </Field>
          </aside>

          {/* Right: content editor — rendered on a white paper surface so
              it visually matches the preview drawer + exported document. */}
          <div className="flex-1 min-w-0 agreement-paper-editor">
            <RichTextEditor
              ref={editorRef}
              initialHtml={initialContent}
              hideFooter
            />
          </div>
        </div>

        {/* Scope the paper look to the agreement-form editor only. The
            ProseMirror editor normally inherits the dark theme via
            `var(--text-primary)` / transparent background. We force white
            bg + near-black text so the Edit-agreement content area reads
            like real paper. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .agreement-paper-editor .tiptap-content,
              .agreement-paper-editor .tiptap-content .ProseMirror {
                background: #ffffff !important;
                color: #111827 !important;
              }
              .agreement-paper-editor .tiptap-content .ProseMirror h1,
              .agreement-paper-editor .tiptap-content .ProseMirror h2,
              .agreement-paper-editor .tiptap-content .ProseMirror h3,
              .agreement-paper-editor .tiptap-content .ProseMirror h4,
              .agreement-paper-editor .tiptap-content .ProseMirror h5,
              .agreement-paper-editor .tiptap-content .ProseMirror h6,
              .agreement-paper-editor .tiptap-content .ProseMirror p,
              .agreement-paper-editor .tiptap-content .ProseMirror li,
              .agreement-paper-editor .tiptap-content .ProseMirror td,
              .agreement-paper-editor .tiptap-content .ProseMirror th {
                color: #111827 !important;
              }
              .agreement-paper-editor .tiptap-content .ProseMirror blockquote {
                color: #374151 !important;
                border-left-color: #93c5fd !important;
              }
              .agreement-paper-editor .tiptap-content .ProseMirror a {
                color: #1d4ed8 !important;
              }
              .agreement-paper-editor .tiptap-content .ProseMirror code {
                background: #f3f4f6 !important;
                color: #111827 !important;
              }
              .agreement-paper-editor .tiptap-content .ProseMirror table,
              .agreement-paper-editor .tiptap-content .ProseMirror th,
              .agreement-paper-editor .tiptap-content .ProseMirror td {
                border-color: #d1d5db !important;
              }
            `,
          }}
        />

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : agreement ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function UserCheckList({
  profiles,
  value,
  onChange,
}: {
  profiles: UserProfile[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  if (profiles.length === 0) {
    return <p className="text-[11px] text-text-muted">No users available.</p>;
  }
  return (
    <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
      {profiles.map((p) => {
        const checked = value.includes(p.id);
        const name =
          [p.first_name, p.last_name].filter(Boolean).join(" ") || p.id;
        return (
          <label
            key={p.id}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary cursor-pointer hover:bg-muted/30"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(checked ? value.filter((x) => x !== p.id) : [...value, p.id])
              }
            />
            <span className="truncate">{name}</span>
            {p.type && (
              <span className="text-[10px] text-text-muted ml-auto capitalize">
                {p.type}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
