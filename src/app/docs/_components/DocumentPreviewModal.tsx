"use client";

/**
 * Reusable white-paper preview modal with PDF + DOCX export.
 *
 * Used by the Playbook and Agreement views to render a clean, print-ready
 * copy of the rich-text document on a white surface (no oklch colors so
 * html2canvas can rasterize it) with download buttons at the top.
 *
 * Mirrors the UX of `PrdPreviewModal` on the Sandbox Planner PRD tab.
 */

import { useRef, useState } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { cn } from "@/lib/utils";
import { exportElementToPdf } from "../../idea-refiner/_lib/exportPdf";
import type { UserProfile } from "@/types/projects";
import type { AgreementVersion } from "@/types/docs";

/**
 * Optional signatures-section payload. When supplied, the preview modal
 * appends a printable signatures block beneath the agreement body and
 * includes that block in PDF + DOCX exports.
 */
export interface PreviewSignaturesData {
  agreement: AgreementVersion;
  profileById: Map<string, UserProfile>;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Shown in the modal header and as the document <h1>. */
  title: string;
  /** Optional small subtitle under the title (e.g. "Playbook"). */
  subtitle?: string;
  /** Rich-text HTML to render inside the paper surface. */
  html: string;
  /** Filename stem for downloads — e.g. "acme-playbook" → "acme-playbook.pdf". */
  filenameBase: string;
  /** When set, render a signatures section (agreement preview mode). */
  signatures?: PreviewSignaturesData;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document"
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  html,
  filenameBase,
  signatures,
}: DocumentPreviewModalProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(filenameBase);
  const signaturesHtml = signatures ? buildSignaturesHtml(signatures) : "";

  async function handleDownloadPdf() {
    if (!docRef.current) return;
    setIsExportingPdf(true);
    setError(null);
    try {
      await exportElementToPdf({
        source: docRef.current,
        filename: `${slug}.pdf`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadDocx() {
    setIsExportingDocx(true);
    setError(null);
    try {
      const htmlDocxMod = await import("html-docx-js/dist/html-docx");
      const asBlob = htmlDocxMod.asBlob ?? htmlDocxMod.default?.asBlob;
      if (!asBlob) throw new Error("html-docx-js module shape unexpected");

      const fullHtml =
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
          title
        )}</title></head>` +
        `<body style="font-family: Georgia, 'Times New Roman', serif; color: #111;">` +
        `<h1 style="font-size: 24pt; margin-bottom: 4pt;">${escapeHtml(title)}</h1>` +
        (subtitle
          ? `<p style="color: #555; margin-top: 0; margin-bottom: 16pt;">${escapeHtml(
              subtitle
            )}</p>`
          : "") +
        (html || "<p><em>(empty)</em></p>") +
        signaturesHtml +
        `</body></html>`;

      const blob = asBlob(fullHtml);
      downloadBlob(blob, `${slug}.docx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate DOCX");
    } finally {
      setIsExportingDocx(false);
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${title} — Preview`}
      width="max-w-4xl"
    >
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 px-6 pt-2 pb-4 border-b border-border">
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isExportingDocx}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "bg-accent text-white hover:bg-accent/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            {isExportingPdf ? "Generating PDF…" : "Download PDF"}
          </button>
          <button
            onClick={handleDownloadDocx}
            disabled={isExportingPdf || isExportingDocx}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "bg-blue-600 text-white hover:bg-blue-700 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            {isExportingDocx ? "Generating DOCX…" : "Download DOCX"}
          </button>
        </div>

        {error && (
          <p className="px-6 pt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Printable document surface — inline hex colors only so html2canvas can rasterize it. */}
        <div className="p-6 bg-black/20 overflow-y-auto max-h-[70vh]">
          <div
            ref={docRef}
            style={{
              background: "#ffffff",
              color: "#111111",
              padding: "40px 56px",
              margin: "0 auto",
              maxWidth: "800px",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "14px",
              lineHeight: "1.6",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              borderRadius: "4px",
            }}
          >
            <h1 style={{ fontSize: "28px", margin: "0 0 4px 0" }}>{title}</h1>
            {subtitle && (
              <p style={{ color: "#666", margin: "0 0 24px 0" }}>{subtitle}</p>
            )}
            {html ? (
              <div
                className="docs-preview-content"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p style={{ color: "#999", fontStyle: "italic" }}>(empty)</p>
            )}
            {signaturesHtml && (
              <div
                className="docs-preview-content"
                dangerouslySetInnerHTML={{ __html: signaturesHtml }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scope clean print-friendly styles for the injected rich text. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .docs-preview-content p,
            .docs-preview-content li,
            .docs-preview-content tr,
            .docs-preview-content blockquote {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .docs-preview-content p { margin: 0 0 10px 0; }
            .docs-preview-content ul, .docs-preview-content ol { margin: 0 0 10px 24px; }
            .docs-preview-content li { margin: 4px 0; }
            .docs-preview-content h1, .docs-preview-content h2, .docs-preview-content h3 {
              margin: 14px 0 6px 0; color: #111;
            }
            .docs-preview-content a { color: #1d4ed8; text-decoration: underline; }
            .docs-preview-content strong { font-weight: 700; }
            .docs-preview-content em { font-style: italic; }
            .docs-preview-content code {
              background: #f3f4f6; padding: 2px 4px; border-radius: 3px;
              font-family: 'Courier New', monospace; font-size: 13px;
            }
            /* Strip the playbook comment-highlight styling when viewed on paper. */
            .docs-preview-content span[data-comment-id],
            .docs-preview-content .comment-highlight {
              background: transparent !important;
              border-bottom: none !important;
            }
          `,
        }}
      />
    </Modal>
  );
}

// ── Signatures helpers (agreement preview only) ────────────────────────────

/**
 * Build the printable Signatures section HTML.
 *
 * Mirrors the in-app `SignaturesBlock` (one card per required signer with
 * either the signature image, a "Signed" placeholder, or "Awaiting
 * signature") but renders as inline HTML so html2canvas + html-docx-js
 * can capture it without React.
 */
function buildSignaturesHtml(data: PreviewSignaturesData): string {
  const { agreement, profileById } = data;
  if (!agreement.required_signers || agreement.required_signers.length === 0) {
    return "";
  }

  // Parse signed-at timestamps from the audit blocks appended by signAgreement.
  const signedAtByUser = new Map<string, string>();
  if (agreement.content) {
    const re =
      /<div[^>]*data-signature-block[^>]*data-user="([^"]+)"[^>]*data-signed-at="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(agreement.content)) !== null) {
      signedAtByUser.set(m[1], m[2]);
    }
  }

  // Render the signer cards in a 2-column table (one row per pair) so
  // both html2canvas (PDF) and html-docx-js (DOCX) lay them out cleanly.
  const total = agreement.required_signers.length;
  const rows: string[] = [];
  for (let i = 0; i < total; i += 2) {
    const leftHtml = renderSignerCell(agreement, profileById, signedAtByUser, i, total);
    const rightHtml =
      i + 1 < total
        ? renderSignerCell(agreement, profileById, signedAtByUser, i + 1, total)
        : `<td style="width:50%;"></td>`;
    rows.push(`<tr>${leftHtml}${rightHtml}</tr>`);
  }

  return `
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #e5e7eb;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:16px;">Signatures</div>
      <table style="border-collapse:separate;border-spacing:0;width:100%;">
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}

function renderSignerCell(
  agreement: AgreementVersion,
  profileById: Map<string, UserProfile>,
  signedAtByUser: Map<string, string>,
  i: number,
  total: number
): string {
  const uid = agreement.required_signers[i];
  const p = profileById.get(uid);
  const fullName = p
    ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown user"
    : "Unknown user";
  const hasSigned = agreement.signed_by.includes(uid);
  const signedAt = signedAtByUser.get(uid);

  function labelFor(idx: number): string {
    if (total === 1) return "SIGNER";
    if (idx === 0) return "CLIENT";
    if (idx === 1) return "SERVICE PROVIDER";
    return `SIGNER ${idx + 1}`;
  }

  const signatureSurface = hasSigned && p?.signature
    ? `<img src="${escapeHtml(p.signature)}" alt="${escapeHtml(fullName)} signature" style="max-height:60px;max-width:100%;object-fit:contain;display:block;margin:0 auto;" />`
    : hasSigned
      ? `<span style="font-style:italic;color:#4b5563;font-size:12px;">Signed</span>`
      : `<span style="font-style:italic;color:#6b7280;font-size:11px;">Awaiting signature</span>`;

  const meta = hasSigned && signedAt
    ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">Signed ${escapeHtml(new Date(signedAt).toLocaleString())}</div>`
    : hasSigned
      ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">Signed</div>`
      : "";

  return `
    <td style="vertical-align:top;padding:0 8px 16px 8px;width:50%;">
      <div style="border:1px solid #e5e7eb;background:#f9fafb;border-radius:6px;padding:14px;">
        <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">${labelFor(i)}</div>
        <div style="height:80px;display:flex;align-items:center;justify-content:center;border-bottom:1px dashed #9ca3af;margin-bottom:8px;">
          ${signatureSurface}
        </div>
        <div style="font-size:13px;font-weight:600;color:#111827;">${escapeHtml(fullName)}</div>
        ${meta}
      </div>
    </td>`;
}
