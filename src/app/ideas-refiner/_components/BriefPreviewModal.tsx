"use client";

import { useRef, useState } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { cn } from "@/lib/utils";
import type { IdeaReport } from "@/types/idea-refiner";
import { exportElementToPdf } from "../_lib/exportPdf";

interface BriefPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaName: string;
  report: IdeaReport | null;
  briefHtmlOverride?: string;
  briefTitleOverride?: string;
  briefSubtitleOverride?: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "brief"
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

export default function BriefPreviewModal({
  isOpen,
  onClose,
  ideaName,
  report,
  briefHtmlOverride,
  briefTitleOverride,
  briefSubtitleOverride,
}: BriefPreviewModalProps) {
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
        filename: `${slugify(ideaName)}-build-brief.pdf`,
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
      const title = briefTitleOverride ?? report?.brief_title ?? "Build Brief";
      const subtitle = briefSubtitleOverride ?? report?.brief_subtitle ?? `Generated for ${ideaName}`;
      const body = briefHtmlOverride ?? report?.brief_html ?? "<p><em>No brief generated yet.</em></p>";
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
        title
      )}</title></head><body style="font-family: Georgia, serif; color: #111;">
<h1 style="font-size: 26pt; margin: 0 0 4pt 0;">${escapeHtml(title)}</h1>
<p style="color: #555; margin: 0 0 16pt 0;">${escapeHtml(subtitle)}</p>
${body}
</body></html>`;
      const blob = asBlob(fullHtml);
      downloadBlob(blob, `${slugify(ideaName)}-build-brief.docx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate DOCX");
    } finally {
      setIsExportingDocx(false);
    }
  }

  const activeBriefHtml = briefHtmlOverride ?? report?.brief_html;
  const title = briefTitleOverride ?? report?.brief_title ?? "Build Brief";
  const subtitle = briefSubtitleOverride ?? report?.brief_subtitle ?? `Generated for ${ideaName}`;

  return (
    <Modal open={isOpen} onClose={onClose} title="Move37 Build Brief" width="max-w-4xl">
      <div className="flex flex-col">
        <div className="flex items-center justify-end gap-2 px-6 pt-2 pb-4 border-b border-border">
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isExportingDocx || !activeBriefHtml}
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
            disabled={isExportingPdf || isExportingDocx || !activeBriefHtml}
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
              style={{ textAlign: "center", paddingBottom: "28px", borderBottom: "2px solid #111", marginBottom: "32px" }}
            >
              <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#666", marginBottom: "12px" }}>
                Move37 Build Brief
              </div>
              <h1 style={{ fontSize: "28px", margin: "0 0 8px 0", fontWeight: 700 }}>{title}</h1>
              <p style={{ color: "#555", margin: 0, fontSize: "15px" }}>{subtitle}</p>
            </div>
            {/* Body */}
            {activeBriefHtml ? (
              <div
                className="brief-body"
                dangerouslySetInnerHTML={{ __html: activeBriefHtml }}
              />
            ) : (
              <p style={{ color: "#999", fontStyle: "italic" }}>No brief generated yet.</p>
            )}
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .brief-body p, .brief-body li, .brief-body tr, .brief-body blockquote {
              break-inside: avoid; page-break-inside: avoid;
            }
            .brief-body h2 { font-size: 20px; margin: 32px 0 10px; color: #111; border-bottom: 2px solid #111; padding-bottom: 6px; font-weight: 700; }
            .brief-body h3 { font-size: 16px; margin: 18px 0 8px; color: #111; font-weight: 600; }
            .brief-body p { margin: 0 0 10px; }
            .brief-body ul, .brief-body ol { margin: 0 0 10px 24px; }
            .brief-body li { margin: 4px 0; }
            .brief-body strong { font-weight: 700; }
            .brief-body em { font-style: italic; }
            .brief-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
            .brief-body th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #d1d5db; }
            .brief-body td { padding: 7px 10px; border: 1px solid #d1d5db; vertical-align: top; }
            .brief-body blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #555; margin: 10px 0; }
          `,
        }}
      />
    </Modal>
  );
}
