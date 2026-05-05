"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, UserProfile } from "@/types/projects";
import type {
  AgreementTemplate,
  AgreementVersion,
  OsAgreementStatus,
} from "@/types/docs";
import {
  AGREEMENT_STATUS_LABELS,
  aggregateAgreementStatus,
} from "@/types/docs";
import { deleteAgreement } from "../actions";
import AgreementRow from "./AgreementRow";
import AgreementFormModal from "./modals/AgreementFormModal";
import TemplateManagerModal from "./modals/TemplateManagerModal";
import DocumentPreviewModal from "./DocumentPreviewModal";
import SignAgreementModal from "./modals/SignAgreementModal";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "agreement"
  );
}

/**
 * The signing flow appends `<div data-signature-block>...</div>` audit
 * blocks to `agreement.content`. The Preview modal renders signers in a
 * dedicated section below the prose, so we strip the stamped blocks
 * from the body to avoid the giant duplicated signature image.
 */
function stripStampedSignatureBlocks(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(
    /<div\b[^>]*\bdata-signature-block\b[\s\S]*?<\/div>\s*/gi,
    ""
  );
}

interface Props {
  project: Project;
  profiles: UserProfile[];
  agreements: AgreementVersion[];
  templates: AgreementTemplate[];
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  isAdminOrManager: boolean;
}

const UNTYPED_KEY = "__untyped";

export default function AgreementsTab({
  project,
  profiles,
  agreements,
  templates,
  currentUserId,
  currentUserProfile,
  isAdminOrManager,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<AgreementVersion | null>(null);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [previewAgreement, setPreviewAgreement] = useState<AgreementVersion | null>(null);
  const [signingAgreement, setSigningAgreement] = useState<AgreementVersion | null>(null);

  // The Preview modal needs a `Map<id, UserProfile>` to look up signer
  // names + signature images. Memoize so we don't rebuild on every render.
  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );
  void currentUserProfile; // referenced indirectly via profileById

  const templateById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates]
  );

  // Group agreements by template id (uuid) — "Untyped" for null.
  const grouped = useMemo(() => {
    const map = new Map<string, AgreementVersion[]>();
    for (const a of agreements) {
      const key = a.type ?? UNTYPED_KEY;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [agreements]);

  function openCreate() {
    setEditingAgreement(null);
    setFormOpen(true);
  }
  function openEdit(agreement: AgreementVersion) {
    setEditingAgreement(agreement);
    setFormOpen(true);
  }

  async function handleDelete(a: AgreementVersion) {
    if (!confirm(`Delete agreement "${a.name ?? "Untitled"}"?`)) return;
    const res = await deleteAgreement(a.id);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  if (agreements.length === 0) {
    return (
      <div className="h-full flex flex-col min-h-0">
        <TopBar
          isAdminOrManager={isAdminOrManager}
          onCreate={openCreate}
          onManageTemplates={() => setTemplateManagerOpen(true)}
        />
        <div className="flex-1 flex items-center justify-center text-center p-10">
          <div>
            <h3 className="text-heading-3 text-text-primary mb-2">No agreements yet</h3>
            <p className="text-sm text-text-muted">
              {isAdminOrManager
                ? "Create the first agreement for this project."
                : "No agreements have been created for this project yet."}
            </p>
          </div>
        </div>

        {formOpen && (
          <AgreementFormModal
            projectId={project.id}
            projectAuthorizedUsers={project.authorized_users ?? []}
            profiles={profiles}
            templates={templates}
            agreement={editingAgreement}
            onClose={() => setFormOpen(false)}
          />
        )}
        {templateManagerOpen && (
          <TemplateManagerModal
            templates={templates}
            onClose={() => setTemplateManagerOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <TopBar
        isAdminOrManager={isAdminOrManager}
        onCreate={openCreate}
        onManageTemplates={() => setTemplateManagerOpen(true)}
      />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {Array.from(grouped.entries()).map(([key, items]) => {
          const templateName =
            key === UNTYPED_KEY
              ? "No template"
              : templateById.get(key)?.name ?? "Unknown template";
          const aggStatus = aggregateAgreementStatus(items);

          return (
            <div key={key} className="border border-border rounded-lg overflow-hidden bg-surface">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-text-primary">{templateName}</h3>
                  <StatusPill status={aggStatus} />
                  <span className="text-[11px] text-text-muted">
                    {items.length} agreement{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ul>
                {items.map((a) => (
                  <AgreementRow
                    key={a.id}
                    agreement={a}
                    profiles={profiles}
                    currentUserId={currentUserId}
                    isAdminOrManager={isAdminOrManager}
                    onOpen={() => setPreviewAgreement(a)}
                    onEdit={() => openEdit(a)}
                    onDelete={() => handleDelete(a)}
                    onSign={() => setSigningAgreement(a)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {formOpen && (
        <AgreementFormModal
          projectId={project.id}
          projectAuthorizedUsers={project.authorized_users ?? []}
          profiles={profiles}
          templates={templates}
          agreement={editingAgreement}
          onClose={() => setFormOpen(false)}
        />
      )}
      {templateManagerOpen && (
        <TemplateManagerModal
          templates={templates}
          onClose={() => setTemplateManagerOpen(false)}
        />
      )}
      {previewAgreement && (
        <DocumentPreviewModal
          isOpen={!!previewAgreement}
          onClose={() => setPreviewAgreement(null)}
          title={previewAgreement.name ?? "Untitled agreement"}
          subtitle="Agreement"
          html={stripStampedSignatureBlocks(previewAgreement.content)}
          filenameBase={slugify(previewAgreement.name ?? "agreement")}
          signatures={{ agreement: previewAgreement, profileById }}
        />
      )}
      {signingAgreement && (
        <SignAgreementModal
          agreement={signingAgreement}
          currentUserProfile={currentUserProfile}
          onClose={() => setSigningAgreement(null)}
        />
      )}
    </div>
  );
}

function TopBar({
  isAdminOrManager,
  onCreate,
  onManageTemplates,
}: {
  isAdminOrManager: boolean;
  onCreate: () => void;
  onManageTemplates: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-border shrink-0 bg-surface">
      {isAdminOrManager && (
        <button
          onClick={onManageTemplates}
          className="px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent"
        >
          Manage templates
        </button>
      )}
      {isAdminOrManager && (
        <button
          onClick={onCreate}
          className="px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white"
        >
          Create agreement
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: OsAgreementStatus }) {
  const color =
    status === "completed"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : status === "ready_to_sign"
      ? "bg-accent/15 text-accent border-accent/30"
      : status === "archived"
      ? "bg-text-muted/15 text-text-muted border-text-muted/30"
      : "bg-muted text-text-muted border-border";
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded-full ${color}`}>
      {AGREEMENT_STATUS_LABELS[status]}
    </span>
  );
}
