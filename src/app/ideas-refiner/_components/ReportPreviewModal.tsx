/**
 * Full-Playbook preview modal for the Sandbox Planner Report step.
 *
 * Renders the AI-generated `playbook_html` on a printable document surface
 * with inline hex styling (no oklch) so html2canvas can rasterise it safely.
 * Exports via the shared per-block PDF helper (no mid-row cuts) and via
 * html-docx-js for DOCX.
 */
"use client";
import { loadHtmlDocx } from "@/lib/load-html-docx";

import { useRef, useState } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import type { IdeaReport } from "@/types/idea-refiner";
import { exportElementToPdf } from "../_lib/exportPdf";

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaName: string;
  report: IdeaReport | null;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "playbook"
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

export default function ReportPreviewModal({
  isOpen,
  onClose,
  ideaName,
  report,
}: ReportPreviewModalProps) {
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
        filename: `${slugify(ideaName)}-playbook.pdf`,
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
      const asBlob = await loadHtmlDocx();
      const title = report?.playbook_title ?? "Product Strategy Playbook";
      const subtitle = report?.playbook_subtitle ?? `Generated for ${ideaName}`;
      const body = report?.playbook_html ?? "<p><em>No playbook generated yet.</em></p>";
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
        title
      )}</title></head><body style="font-family: Georgia, serif; color: #111;">
<h1 style="font-size: 26pt; margin: 0 0 4pt 0;">${escapeHtml(title)}</h1>
<p style="color: #555; margin: 0 0 16pt 0;">${escapeHtml(subtitle)}</p>
${body}
</body></html>`;
      const blob = asBlob(fullHtml);
      downloadBlob(blob, `${slugify(ideaName)}-playbook.docx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate DOCX");
    } finally {
      setIsExportingDocx(false);
    }
  }

  const score = report?.final_score ?? 0;
  // Typed as string so legacy buckets ("ready"/"risk") on older reports still map.
  const threshold: string | null = report?.threshold_bucket ?? null;
  const scoreColor =
    threshold === "build" || threshold === "ready"
      ? "#16a34a"
      : threshold === "refine"
      ? "#d97706"
      : "#dc2626";
  const title = report?.playbook_title ?? "Product Strategy Playbook";
  const subtitle = report?.playbook_subtitle ?? `Generated for ${ideaName}`;

  return (
    <Modal open={isOpen} onClose={onClose} title="Move37 Playbook" width="max-w-4xl">
      <div className="flex flex-col">
        <div className="flex items-center justify-end gap-2 px-6 pt-2 pb-4 border-b border-border">
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isExportingDocx || !report}
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
            disabled={isExportingPdf || isExportingDocx || !report}
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
        <div className="p-6 bg-black/20 max-h-[70vh] overflow-y-auto">
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
            {/* Cover block */}
            <div
              className="keep-together"
              style={{ textAlign: "center", paddingBottom: "28px", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "120px",
                  height: "120px",
                  borderRadius: "9999px",
                  background: "#f3f4f6",
                  border: `6px solid ${scoreColor}`,
                  margin: "0 auto 16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#111" }}>{score}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>/ 100</div>
                </div>
              </div>
              <h1 style={{ fontSize: "28px", margin: "0 0 4px 0" }}>{title}</h1>
              <p style={{ color: "#666", margin: 0 }}>{subtitle}</p>
            </div>
            {/* Body */}
            {report?.playbook_html ? (
              <div
                className="playbook-body"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(report.playbook_html) }}
              />
            ) : (
              <p style={{ color: "#999", fontStyle: "italic" }}>No playbook generated yet.</p>
            )}
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(`
            .playbook-body p, .playbook-body li, .playbook-body tr, .playbook-body blockquote {
              break-inside: avoid; page-break-inside: avoid;
            }
            .playbook-body h2 { font-size: 22px; margin: 28px 0 10px; color: #111; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            .playbook-body h3 { font-size: 17px; margin: 18px 0 8px; color: #111; }
            .playbook-body p { margin: 0 0 10px; }
            .playbook-body ul, .playbook-body ol { margin: 0 0 10px 24px; }
            .playbook-body li { margin: 4px 0; }
            .playbook-body strong { font-weight: 700; }
            .playbook-body em { font-style: italic; }
            .playbook-body a { color: #1d4ed8; text-decoration: underline; }
            .playbook-body blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #555; margin: 10px 0; }
          `),
        }}
      />
    </Modal>
  );
}
