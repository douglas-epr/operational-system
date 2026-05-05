"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import type { AgreementTemplate } from "@/types/docs";
import {
  createAgreementTemplate,
  deleteAgreementTemplate,
  updateAgreementTemplate,
} from "../../actions";

interface Props {
  templates: AgreementTemplate[];
  onClose: () => void;
}

type Mode =
  | { kind: "list" }
  | { kind: "edit"; template: AgreementTemplate }
  | { kind: "create" };

export default function TemplateManagerModal({ templates, onClose }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [pending, startTransition] = useTransition();
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [name, setName] = useState("");

  function openCreate() {
    setName("");
    setMode({ kind: "create" });
  }

  function openEdit(t: AgreementTemplate) {
    setName(t.name);
    setMode({ kind: "edit", template: t });
  }

  function backToList() {
    setMode({ kind: "list" });
  }

  function handleSave() {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    const content = editorRef.current?.getHTML() ?? "";
    startTransition(async () => {
      const res =
        mode.kind === "edit"
          ? await updateAgreementTemplate(mode.template.id, {
              name: name.trim(),
              content,
            })
          : await createAgreementTemplate({ name: name.trim(), content });
      if (res.error) alert(res.error);
      else {
        router.refresh();
        backToList();
      }
    });
  }

  function handleDelete(t: AgreementTemplate) {
    if (!confirm(`Delete template "${t.name}"? Agreements linked to it will be unlinked.`))
      return;
    startTransition(async () => {
      const res = await deleteAgreementTemplate(t.id);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-stretch p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg flex flex-col w-full max-w-4xl mx-auto overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text-primary">
            {mode.kind === "list"
              ? "Agreement templates"
              : mode.kind === "edit"
              ? "Edit template"
              : "New template"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <svg
              className="w-5 h-5"
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

        {mode.kind === "list" ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-end px-6 py-3 border-b border-border shrink-0">
              <button
                onClick={openCreate}
                className="px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white"
              >
                New template
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-text-muted">No templates yet.</p>
                </div>
              ) : (
                <ul>
                  {templates.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          {t.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Updated {new Date(t.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(t)}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={pending}
                          className="px-2.5 py-1 text-[11px] rounded-md text-text-muted hover:text-red-400 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="px-6 py-3 border-b border-border shrink-0 flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className="flex-1 bg-muted border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <RichTextEditor
                ref={editorRef}
                initialHtml={
                  mode.kind === "edit" ? mode.template.content ?? "" : ""
                }
                hideFooter
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-border shrink-0">
              <button
                onClick={backToList}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={backToList}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={pending}
                  className="px-4 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-60"
                >
                  {pending
                    ? "Saving…"
                    : mode.kind === "edit"
                    ? "Save changes"
                    : "Create template"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
