"use client";

/**
 * Visual tile for a single `DocsAttachment`.
 *
 * Renders an image thumbnail for image mime-types, or a colored extension
 * badge for everything else (PDF / DOC / XLS / …). Clicking opens the file
 * in a new tab. Used in the Docs ▸ Files tab.
 */

import type { DocsAttachment } from "@/types/docs";

interface Props {
  attachment: DocsAttachment;
  /** Edge length of the thumbnail square. Default 40px. */
  size?: number;
}

type IconStyle = {
  bg: string;   // Tailwind bg-* class
  text: string; // Tailwind text-* class
  label: string; // 3-letter uppercase badge text
};

function styleForAttachment(a: DocsAttachment): IconStyle {
  const ext = (a.name.includes(".") ? a.name.split(".").pop()! : "").toLowerCase();
  const mime = (a.type ?? "").toLowerCase();

  // Videos
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "mkv", "avi"].includes(ext)) {
    return { bg: "bg-purple-500/15", text: "text-purple-400", label: "VID" };
  }
  // Audio
  if (mime.startsWith("audio/") || ["mp3", "wav", "m4a", "flac", "ogg"].includes(ext)) {
    return { bg: "bg-pink-500/15", text: "text-pink-400", label: "AUD" };
  }
  // PDF
  if (mime === "application/pdf" || ext === "pdf") {
    return { bg: "bg-red-500/15", text: "text-red-400", label: "PDF" };
  }
  // Word
  if (
    mime.includes("wordprocessingml") ||
    mime === "application/msword" ||
    ["doc", "docx", "rtf", "odt"].includes(ext)
  ) {
    return { bg: "bg-blue-500/15", text: "text-blue-400", label: "DOC" };
  }
  // Excel
  if (
    mime.includes("spreadsheetml") ||
    mime === "application/vnd.ms-excel" ||
    ["xls", "xlsx", "csv", "ods"].includes(ext)
  ) {
    return { bg: "bg-green-500/15", text: "text-green-400", label: "XLS" };
  }
  // PowerPoint
  if (
    mime.includes("presentationml") ||
    mime === "application/vnd.ms-powerpoint" ||
    ["ppt", "pptx", "odp", "key"].includes(ext)
  ) {
    return { bg: "bg-orange-500/15", text: "text-orange-400", label: "PPT" };
  }
  // Archive
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
    return { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "ZIP" };
  }
  // Code / data
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    [
      "txt", "md", "json", "xml", "html", "css", "js", "jsx", "ts", "tsx",
      "py", "rb", "go", "rs", "sh", "yml", "yaml", "sql",
    ].includes(ext)
  ) {
    return { bg: "bg-cyan-500/15", text: "text-cyan-400", label: ext ? ext.slice(0, 3).toUpperCase() : "TXT" };
  }
  // Design (Figma / AI / PSD / Sketch / XD)
  if (["fig", "ai", "psd", "sketch", "xd"].includes(ext)) {
    return { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", label: ext.toUpperCase().slice(0, 3) };
  }
  // Fallback — show first 3 letters of the extension, or "FILE"
  return {
    bg: "bg-muted",
    text: "text-text-muted",
    label: ext ? ext.toUpperCase().slice(0, 3) : "FILE",
  };
}

function isImage(a: DocsAttachment): boolean {
  const ext = (a.name.includes(".") ? a.name.split(".").pop()! : "").toLowerCase();
  const mime = (a.type ?? "").toLowerCase();
  return (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "ico"].includes(ext)
  );
}

export default function AttachmentTile({ attachment, size = 40 }: Props) {
  const style = styleForAttachment(attachment);
  const showThumb = isImage(attachment);
  const boxStyle = { width: size, height: size };

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      title={attachment.name}
      className="group flex items-center gap-2 min-w-0 max-w-[220px] hover:underline"
    >
      <div
        style={boxStyle}
        className={`shrink-0 rounded-md overflow-hidden flex items-center justify-center border border-border ${showThumb ? "bg-muted" : style.bg}`}
      >
        {showThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`text-[10px] font-bold tracking-wider ${style.text}`}>
            {style.label}
          </span>
        )}
      </div>
      <span className="text-[11px] text-text-secondary truncate group-hover:text-text-primary">
        {attachment.name}
      </span>
    </a>
  );
}
