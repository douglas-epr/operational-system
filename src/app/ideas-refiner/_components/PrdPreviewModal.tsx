/**
 * Full-PRD preview modal with PDF + DOCX export.
 *
 * - Renders every PRD section in order, as a single continuous document.
 * - Uses inline styles (hex colors only) so the document surface is safe to
 *   feed into html2canvas, which does not support modern color functions
 *   like oklch() that Tailwind v4 emits by default.
 * - PDF export: jspdf + html2canvas (both dynamically imported to keep the
 *   main bundle small).
 * - DOCX export: html-docx-js (dynamically imported).
 */
"use client";

import { useRef, useState } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { exportElementToPdf } from "../_lib/exportPdf";

export interface PrdPreviewSection {
  key: string;
  label: string;
  html: string;
}

interface PrdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaName: string;
  sections: PrdPreviewSection[];
}

/** Simple, safe filename from an idea name. */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "prd"
  );
}

/** Trigger a download for a Blob. */
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

export default function PrdPreviewModal({
  isOpen,
  onClose,
  ideaName,
  sections,
}: PrdPreviewModalProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    if (!docRef.current) return;
    setIsExportingPdf(true);
    setError(null);
    try {
      await exportElementToPdf({
        source: docRef.current,
        filename: `${slugify(ideaName)}-prd.pdf`,
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
      // html-docx-js is CJS; depending on interop we may get asBlob on the
      // namespace or on `.default`. Fall back between the two.
      const asBlob =
        htmlDocxMod.asBlob ?? htmlDocxMod.default?.asBlob;
      if (!asBlob) throw new Error("html-docx-js module shape unexpected");

      const bodyHtml = sections
        .map(
          (s) =>
            `<h2 style="font-family: Georgia, serif; font-size: 18pt; color: #111; margin-top: 24pt; margin-bottom: 8pt;">${escapeHtml(
              s.label
            )}</h2>${s.html || "<p><em>(empty)</em></p>"}`
        )
        .join("");

      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
        ideaName
      )} — PRD</title></head><body style="font-family: Georgia, serif; color: #111;">
<h1 style="font-size: 24pt; margin-bottom: 4pt;">${escapeHtml(ideaName)} — PRD</h1>
<p style="color: #555; margin-top: 0; margin-bottom: 16pt;">Product Requirements Document</p>
${bodyHtml}
</body></html>`;

      const blob = asBlob(fullHtml);
      downloadBlob(blob, `${slugify(ideaName)}-prd.docx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate DOCX");
    } finally {
      setIsExportingDocx(false);
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title={`${ideaName} — PRD Preview`} width="max-w-4xl">
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {isExportingPdf ? "Generating PDF..." : "Download PDF"}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {isExportingDocx ? "Generating DOCX..." : "Download DOCX"}
          </button>
        </div>

        {error && (
          <p className="px-6 pt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Printable document surface — inline styles only (no oklch) so html2canvas can render it. */}
        <div className="p-6 bg-black/20">
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
            <h1 style={{ fontSize: "28px", margin: "0 0 4px 0" }}>
              {ideaName} — PRD
            </h1>
            <p style={{ color: "#666", margin: "0 0 24px 0" }}>
              Product Requirements Document
            </p>
            {sections.map((s) => (
              <section key={s.key} style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "8px", color: "#111" }}>
                  {s.label}
                </h2>
                {s.html ? (
                  <div
                    className="prd-section-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.html) }}
                  />
                ) : (
                  <p style={{ color: "#999", fontStyle: "italic" }}>(empty)</p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Scope styles for the injected rich text so lists, links, etc. render cleanly without oklch. */}
      <style
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(`
            .prd-section-content p,
            .prd-section-content li,
            .prd-section-content tr,
            .prd-section-content blockquote {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .prd-section-content p { margin: 0 0 10px 0; }
            .prd-section-content ul, .prd-section-content ol { margin: 0 0 10px 24px; }
            .prd-section-content li { margin: 4px 0; }
            .prd-section-content h1, .prd-section-content h2, .prd-section-content h3 {
              margin: 14px 0 6px 0; color: #111;
            }
            .prd-section-content a { color: #1d4ed8; text-decoration: underline; }
            .prd-section-content strong { font-weight: 700; }
            .prd-section-content em { font-style: italic; }
            .prd-section-content code {
              background: #f3f4f6; padding: 2px 4px; border-radius: 3px;
              font-family: 'Courier New', monospace; font-size: 13px;
            }
          `),
        }}
      />
    </Modal>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
