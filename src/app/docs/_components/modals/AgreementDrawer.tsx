"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/projects";
import type {
  AgreementTemplate,
  AgreementVersion,
  OsAgreementStatus,
} from "@/types/docs";
import { AGREEMENT_STATUS_LABELS } from "@/types/docs";
import DocumentPreviewModal from "../DocumentPreviewModal";

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
 * The `signAgreement` server action appends a `<div data-signature-block>`
 * with a big signature image to `agreement.content` as a permanent audit
 * record. The Signatures card rendered below the prose already shows the
 * same signature at a smaller, signer-by-signer scale, so stripping the
 * stamped block from the *display* copy avoids the duplicated giant
 * signature. The database row is untouched — the SignaturesBlock still
 * parses `data-signed-at` timestamps out of the stored content for its
 * "Signed <date>" line.
 */
function stripStampedSignatureBlocks(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(
    /<div\b[^>]*\bdata-signature-block\b[\s\S]*?<\/div>\s*/gi,
    ""
  );
}

interface Props {
  agreement: AgreementVersion;
  profiles: UserProfile[];
  templates: AgreementTemplate[];
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  isAdminOrManager: boolean;
  onClose: () => void;
  onSign: () => void;
  onEdit: () => void;
}

export default function AgreementDrawer({
  agreement,
  profiles,
  templates,
  currentUserId,
  currentUserProfile,
  isAdminOrManager,
  onClose,
  onSign,
  onEdit,
}: Props) {
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const template = agreement.type
    ? templates.find((t) => t.id === agreement.type) ?? null
    : null;

  const agreementTitle = agreement.name ?? "Untitled agreement";
  const agreementSlug = slugify(agreementTitle);
  // Visible content has the stamped big-signature blocks stripped — the
  // SignaturesBlock below the prose shows each signer's smaller signature.
  const displayContent = stripStampedSignatureBlocks(agreement.content);
  const [showPreview, setShowPreview] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExportPdf() {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:800px;background:#fff;color:#111;font-family:Georgia,serif;font-size:14px;line-height:1.6;padding:40px 56px;";
      container.innerHTML =
        `<h1 style="font-size:26px;margin:0 0 6px">${agreementTitle}</h1>` +
        `<p style="color:#666;margin:0 0 20px">Agreement</p>` +
        (displayContent || "<p><em>(empty)</em></p>");
      document.body.appendChild(container);

      const { exportElementToPdf } = await import("../../../ideas-refiner/_lib/exportPdf");
      try {
        await exportElementToPdf({
          source: container,
          filename: `${agreementSlug}.pdf`,
        });
      } finally {
        document.body.removeChild(container);
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportDocx() {
    setIsExportingDocx(true);
    setExportError(null);
    try {
      const htmlDocxMod = await import("html-docx-js/dist/html-docx");
      const asBlob = htmlDocxMod.asBlob ?? htmlDocxMod.default?.asBlob;
      if (!asBlob) throw new Error("html-docx-js not available");
      const fullHtml =
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${agreementTitle}</title></head>` +
        `<body style="font-family: Georgia, 'Times New Roman', serif; color: #111;">` +
        `<h1 style="font-size: 24pt; margin-bottom: 4pt;">${agreementTitle}</h1>` +
        `<p style="color:#555;margin-top:0;margin-bottom:16pt;">Agreement</p>` +
        (displayContent || "<p><em>(empty)</em></p>") +
        `</body></html>`;
      const blob = asBlob(fullHtml);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agreementSlug}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "DOCX export failed");
    } finally {
      setIsExportingDocx(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-stretch p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg flex flex-col w-full max-w-5xl mx-auto overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">
              {agreementTitle}
            </h2>
            <p className="text-[11px] text-text-muted">
              Updated {new Date(agreement.updated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {exportError && (
              <span className="text-xs text-red-400" role="alert">
                {exportError}
              </span>
            )}
            <button
              onClick={() => setShowPreview(true)}
              title="Preview agreement"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-sm"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || isExportingDocx}
              title="Download agreement as PDF"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              {isExportingPdf ? "Generating…" : "PDF"}
            </button>
            <button
              onClick={handleExportDocx}
              disabled={isExportingPdf || isExportingDocx}
              title="Download agreement as DOCX"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              {isExportingDocx ? "Generating…" : "DOCX"}
            </button>
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
        </div>

        <div className="flex-1 overflow-hidden flex min-h-0">
          {isAdminOrManager && (
          <aside className="w-[300px] shrink-0 border-r border-border overflow-y-auto p-5 flex flex-col gap-4">
            <Section label="Status">
              <StatusBadge status={agreement.status} />
            </Section>

            <Section label="Template">
              <p className="text-xs text-text-primary">
                {template?.name ?? "No template"}
              </p>
            </Section>

            {agreement.google_docs_url && (
              <Section label="Google Docs">
                <a
                  href={agreement.google_docs_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline break-all"
                >
                  {agreement.google_docs_url}
                </a>
              </Section>
            )}

            <Section label="Authorized users">
              <UserList
                ids={agreement.authorized_users}
                profileById={profileById}
              />
            </Section>

            <Section label="Required signers">
              <UserList
                ids={agreement.required_signers}
                profileById={profileById}
              />
            </Section>

            <Section
              label={`Signed (${agreement.signed_by.length}/${
                agreement.required_signers.length ||
                agreement.authorized_users.length ||
                0
              })`}
            >
              <UserList
                ids={agreement.signed_by}
                profileById={profileById}
                emptyText="Not signed yet."
              />
            </Section>
          </aside>
          )}

          <div
            className="flex-1 min-w-0 overflow-y-auto p-8"
            style={{ background: "#ffffff", color: "#111827" }}
          >
            {displayContent ? (
              <div
                className="agreement-paper-content prose max-w-none text-sm"
                style={{ color: "#111827" }}
                dangerouslySetInnerHTML={{ __html: displayContent }}
              />
            ) : (
              <p className="text-sm" style={{ color: "#6b7280" }}>No content.</p>
            )}

            {agreement.required_signers.length > 0 && (
              <SignaturesBlock
                agreement={agreement}
                profileById={profileById}
                currentUserId={currentUserId}
                currentUserProfile={currentUserProfile}
                onSign={onSign}
              />
            )}
          </div>
        </div>

        {/* Scope the paper-style typography so dark-theme variables don't
            bleed into the white content column. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .agreement-paper-content,
              .agreement-paper-content p,
              .agreement-paper-content li,
              .agreement-paper-content span,
              .agreement-paper-content div,
              .agreement-paper-content td,
              .agreement-paper-content th { color: #111827; }
              .agreement-paper-content h1,
              .agreement-paper-content h2,
              .agreement-paper-content h3,
              .agreement-paper-content h4 { color: #111827; }
              .agreement-paper-content a { color: #1d4ed8; text-decoration: underline; }
              .agreement-paper-content strong { color: #111827; font-weight: 700; }
              .agreement-paper-content em { color: #111827; font-style: italic; }
              .agreement-paper-content code {
                background: #f3f4f6; color: #111827;
                padding: 2px 4px; border-radius: 3px;
              }
            `,
          }}
        />

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border shrink-0">
          {(() => {
            const isCreator = agreement.created_by === currentUserId;
            const isSignedByMe = agreement.signed_by.includes(currentUserId);
            const isAuthorized =
              agreement.authorized_users.includes(currentUserId) ||
              agreement.required_signers.includes(currentUserId);
            const canSign =
              agreement.status === "ready_to_sign" && isAuthorized && !isSignedByMe;
            const hasSignature = !!currentUserProfile?.signature;
            const canEdit = isAdminOrManager || isCreator;
            return (
              <>
                {agreement.status === "completed" && (
                  <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-1 border rounded-full bg-green-500/15 text-green-400 border-green-500/30">
                    Completed
                  </span>
                )}
                {isSignedByMe && agreement.status === "ready_to_sign" && (
                  <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-1 border rounded-full bg-accent/15 text-accent border-accent/30">
                    Signed · awaiting others
                  </span>
                )}
                {canSign && hasSignature && (
                  <button
                    onClick={onSign}
                    className="px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white"
                  >
                    Sign with my signature
                  </button>
                )}
                {canSign && !hasSignature && (
                  <Link
                    href="/profile"
                    className="px-3 py-1.5 text-xs rounded-md border border-accent text-accent hover:bg-accent/10"
                  >
                    Upload signature to sign
                  </Link>
                )}
                {canEdit && (
                  <button
                    onClick={onEdit}
                    className="px-3 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-accent"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  Close
                </button>
              </>
            );
          })()}
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={agreementTitle}
          subtitle="Agreement"
          html={displayContent}
          filenameBase={agreementSlug}
        />
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function UserList({
  ids,
  profileById,
  emptyText = "None.",
}: {
  ids: string[];
  profileById: Map<string, UserProfile>;
  emptyText?: string;
}) {
  if (ids.length === 0) {
    return <p className="text-[11px] text-text-muted">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {ids.map((id) => {
        const p = profileById.get(id);
        const name = p
          ? [p.first_name, p.last_name].filter(Boolean).join(" ") || id
          : id;
        return (
          <li key={id} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-semibold overflow-hidden">
              {p?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.picture}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                name[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <span className="text-xs text-text-secondary truncate">
              {name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Inline signature section rendered beneath the agreement body.
 * Mirrors the reference PDF layout: one row per required signer with a
 * label (CLIENT / SERVICE PROVIDER / SIGNER N), profile name, and either
 * the rendered signature image, a "Sign here" CTA for the current user,
 * or an "Awaiting signature" placeholder.
 */
function SignaturesBlock({
  agreement,
  profileById,
  currentUserId,
  currentUserProfile,
  onSign,
}: {
  agreement: AgreementVersion;
  profileById: Map<string, UserProfile>;
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  onSign: () => void;
}) {
  // Parse signed-at timestamps out of the HTML audit blocks appended by signAgreement.
  const signedAtByUser = new Map<string, string>();
  if (agreement.content) {
    const re =
      /<div[^>]*data-signature-block[^>]*data-user="([^"]+)"[^>]*data-signed-at="([^"]+)"/g;
    let m;
    while ((m = re.exec(agreement.content)) !== null) {
      signedAtByUser.set(m[1], m[2]);
    }
  }

  function labelFor(i: number, total: number): string {
    if (total === 1) return "SIGNER";
    if (i === 0) return "CLIENT";
    if (i === 1) return "SERVICE PROVIDER";
    return `SIGNER ${i + 1}`;
  }

  return (
    <div className="mt-12 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
      <p
        className="text-[11px] uppercase tracking-widest mb-4"
        style={{ color: "#6b7280" }}
      >
        Signatures
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agreement.required_signers.map((uid, i) => {
          const p = profileById.get(uid);
          const fullName = p
            ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown user"
            : "Unknown user";
          const hasSigned = agreement.signed_by.includes(uid);
          const isMe = uid === currentUserId;
          const signedAt = signedAtByUser.get(uid);
          const canSignNow =
            isMe && !hasSigned && agreement.status === "ready_to_sign";
          const hasSignature = !!currentUserProfile?.signature;
          const label = labelFor(i, agreement.required_signers.length);

          return (
            <div
              key={uid}
              className="rounded-md p-4 flex flex-col gap-2"
              style={{
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "#6b7280" }}
              >
                {label}
              </p>

              <div
                className="h-20 flex items-center justify-center"
                style={{ borderBottom: "1px dashed #9ca3af" }}
              >
                {hasSigned && p?.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.signature}
                    alt={`${fullName} signature`}
                    className="max-h-16 object-contain"
                  />
                ) : hasSigned ? (
                  <span className="text-xs italic" style={{ color: "#4b5563" }}>Signed</span>
                ) : canSignNow && hasSignature ? (
                  <button
                    onClick={onSign}
                    className="px-4 py-2 text-xs font-semibold rounded-md bg-accent hover:bg-accent-hover text-white"
                  >
                    Sign here
                  </button>
                ) : canSignNow && !hasSignature ? (
                  <Link
                    href="/profile"
                    className="px-3 py-1.5 text-[11px] rounded-md border border-accent text-accent hover:bg-accent/10"
                  >
                    Upload signature to sign
                  </Link>
                ) : (
                  <span className="text-[11px] italic" style={{ color: "#6b7280" }}>
                    Awaiting signature
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                  {fullName}
                </span>
                {hasSigned && signedAt && (
                  <span className="text-[10px]" style={{ color: "#6b7280" }}>
                    Signed {new Date(signedAt).toLocaleString()}
                  </span>
                )}
                {hasSigned && !signedAt && (
                  <span className="text-[10px]" style={{ color: "#6b7280" }}>Signed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OsAgreementStatus }) {
  const color =
    status === "completed"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : status === "ready_to_sign"
      ? "bg-accent/15 text-accent border-accent/30"
      : status === "archived"
      ? "bg-text-muted/15 text-text-muted border-text-muted/30"
      : "bg-muted text-text-muted border-border";
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded-full ${color}`}
    >
      {AGREEMENT_STATUS_LABELS[status]}
    </span>
  );
}
