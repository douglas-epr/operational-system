/**
 * LogoPickerModal — two-tab modal for setting a Design System logo.
 * Tab 1: Upload an image/SVG from disk.
 * Tab 2: AI-generate 4 SVG concept logos; user picks one.
 *
 * On confirmation the parent receives the saved logo data and can proceed
 * to trigger the full Design System generation.
 */
"use client";

import { useRef, useState } from "react";
import DOMPurify from "dompurify";
import { createClient } from "@/lib/supabase/client";
import Modal, { ModalBody, ModalFooter } from "@/components/ui/Modal";
import { generateIdeaLogos, saveIdeaLogo } from "../actions";

const BUCKET = "project-files";

interface LogoData {
  logo_url: string | null;
  logo_svg: string | null;
  logo_type: "upload" | "ai_svg";
  logo_colors: { hex: string; label: string }[];
}

interface LogoPickerModalProps {
  ideaId: string;
  open: boolean;
  onClose: () => void;
  /** Called after the logo has been saved to DB */
  onLogoSaved: (data: LogoData) => void;
}

type Tab = "upload" | "ai";

// ── Color extraction helpers ────────────────────────────────────────────────

function extractSvgColors(svgMarkup: string): { hex: string; label: string }[] {
  const hexPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  const found = new Set<string>();
  let m;
  while ((m = hexPattern.exec(svgMarkup)) !== null) {
    const raw = m[1];
    const hex = raw.length === 3
      ? `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
      : `#${raw}`;
    // Skip near-black and near-white
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma > 15 && luma < 240) found.add(hex.toUpperCase());
  }
  const colors = Array.from(found).slice(0, 6);
  return colors.map((hex, i) => ({ hex, label: `Color ${i + 1}` }));
}

async function extractRasterColors(file: File): Promise<{ hex: string; label: string }[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const SIZE = 80;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve([]); URL.revokeObjectURL(url); return; }
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (a < 128) continue;
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luma < 15 || luma > 240) continue;
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        buckets[key] = (buckets[key] ?? 0) + 1;
      }
      const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 6);
      URL.revokeObjectURL(url);
      resolve(sorted.map(([key], i) => {
        const [r, g, b] = key.split(",").map(Number);
        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
        return { hex, label: `Color ${i + 1}` };
      }));
    };
    img.onerror = () => { resolve([]); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LogoPickerModal({ ideaId, open, onClose, onLogoSaved }: LogoPickerModalProps) {
  const [tab, setTab] = useState<Tab>("upload");

  // Upload tab state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI tab state
  const [generating, setGenerating] = useState(false);
  const [aiLogos, setAiLogos] = useState<{ svg: string; name: string; rationale: string }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    setAiError(null);
    setSelectedIdx(null);
    const result = await generateIdeaLogos(ideaId);
    setGenerating(false);
    if (result.error || !result.logos) {
      setAiError(result.error ?? "Failed to generate logos");
      return;
    }
    setAiLogos(result.logos);
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);

    try {
      let logoData: LogoData;

      if (tab === "upload") {
        if (!uploadFile) { setError("Please select a file first."); setSaving(false); return; }

        const supabase = createClient();
        const ext = uploadFile.name.includes(".") ? uploadFile.name.split(".").pop() : "png";
        const path = `idea-logos/${ideaId}/${crypto.randomUUID()}.${ext}`;
        const isSvg = uploadFile.type === "image/svg+xml" || ext === "svg";

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, uploadFile, { upsert: false, contentType: uploadFile.type || "image/png" });
        if (uploadError) { setError(`Upload failed: ${uploadError.message}`); setSaving(false); return; }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const logo_url = urlData.publicUrl;

        let logo_svg: string | null = null;
        let colors: { hex: string; label: string }[] = [];

        if (isSvg) {
          const text = await uploadFile.text();
          logo_svg = text;
          colors = extractSvgColors(text);
        } else {
          colors = await extractRasterColors(uploadFile);
        }

        logoData = { logo_url, logo_svg, logo_type: "upload", logo_colors: colors };
      } else {
        if (selectedIdx === null) { setError("Please select a logo concept."); setSaving(false); return; }
        const picked = aiLogos[selectedIdx];
        const supabase = createClient();
        const path = `idea-logos/${ideaId}/${crypto.randomUUID()}.svg`;
        const svgBlob = new Blob([picked.svg], { type: "image/svg+xml" });
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, svgBlob, { upsert: false, contentType: "image/svg+xml" });
        if (uploadError) { setError(`Upload failed: ${uploadError.message}`); setSaving(false); return; }
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const colors = extractSvgColors(picked.svg);
        logoData = { logo_url: urlData.publicUrl, logo_svg: picked.svg, logo_type: "ai_svg", logo_colors: colors };
      }

      // Seed first 4 extracted colors as primary/secondary/accent/neutral
      const [c0, c1, c2, c3] = logoData.logo_colors;
      const result = await saveIdeaLogo(ideaId, {
        ...logoData,
        primary_color: c0?.hex,
        secondary_color: c1?.hex,
        accent_color: c2?.hex,
        neutral_color: c3?.hex,
      });

      if (result.error) { setError(result.error); setSaving(false); return; }
      onLogoSaved(logoData);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isBusy = uploading || saving || generating;

  return (
    <Modal open={open} onClose={onClose} title="Set Brand Logo" subtitle="Upload your logo or generate one with AI." size="lg">
      <ModalBody>
        {/* Tab switcher */}
        <div className="flex gap-1 mb-5 p-1 bg-muted rounded-lg w-fit">
          {(["upload", "ai"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-elevated text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t === "upload" ? "Upload Logo" : "Generate with AI"}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {tab === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadPreview ? (
                <img src={uploadPreview} alt="Logo preview" className="max-h-32 max-w-full mx-auto object-contain" />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-primary">Click to select a logo file</p>
                  <p className="text-xs text-text-muted">SVG, PNG, JPG — up to 5 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadFile && (
              <p className="text-xs text-text-secondary">Selected: {uploadFile.name}</p>
            )}
          </div>
        )}

        {/* AI Generate tab */}
        {tab === "ai" && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              AI will generate 4 logo concepts based on your idea and PRD. Select the one you want to use.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isBusy}
              className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating…" : aiLogos.length > 0 ? "Regenerate Logos" : "Generate Logo Concepts"}
            </button>
            {aiError && <p className="text-sm text-red-500">{aiError}</p>}
            {aiLogos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {aiLogos.map((logo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      selectedIdx === i
                        ? "border-accent bg-accent/5"
                        : "border-border bg-elevated hover:border-border-subtle"
                    }`}
                  >
                    <div
                      className="w-full aspect-square flex items-center justify-center bg-white rounded-md mb-2 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(logo.svg, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
                    />
                    <p className="text-xs font-semibold text-text-primary truncate">{logo.name}</p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{logo.rationale}</p>
                    {selectedIdx === i && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isBusy || (tab === "upload" && !uploadFile) || (tab === "ai" && selectedIdx === null)}
          className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Use This Logo"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
