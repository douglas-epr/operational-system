/**
 * Rich Text Editor.
 * TipTap wrapper with a full formatting toolbar (Bold/Italic/Underline/Strike,
 * Headings, Lists, Code, Alignment, Link, Color, Highlight, Image, Tables).
 * Renders with the `.tiptap-content` wrapper class so globals.css styles
 * (table borders, placeholder, images, etc.) apply consistently.
 */
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  /** Initial HTML content. */
  content: string;
  /** Called with updated HTML on every change. */
  onChange: (html: string) => void;
  /** Whether the editor is interactive. Defaults to true. */
  editable?: boolean;
  /** Placeholder rendered when the editor is empty. */
  placeholder?: string;
  /** Tailwind class controlling the minimum editor height (e.g. "min-h-24"). Default: min-h-48. */
  minHeight?: string;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

const SWATCHES = [
  "#f4f4f5", "#93c5fd", "#86efac", "#fcd34d",
  "#fca5a5", "#d8b4fe", "#f9a8d4", "#52525b",
];

/** TipTap-based rich text editor with a full formatting toolbar. */
export default function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder = "",
  minHeight = "min-h-48",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "tiptap-table" } }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm prose-invert max-w-none px-3 py-2.5 text-sm text-text-primary focus:outline-none",
          minHeight
        ),
      },
    },
  });

  // Sync editor content when the content prop changes externally (e.g. switching ICP).
  // TipTap's useEditor only uses `content` as the initial value; it won't react to prop changes.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [editor, content]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL (leave empty to remove)", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div
      className={cn(
        "tiptap-content rounded-lg border border-border bg-base overflow-hidden",
        className
      )}
    >
      {editable && (
        <div
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface"
          role="toolbar"
          aria-label="Text formatting"
        >
          {/* ── Text ── */}
          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <span className="line-through">S</span>
          </ToolbarButton>

          <Separator />

          {/* ── Headings ── */}
          <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
          <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
          <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>

          <Separator />

          {/* ── Lists ── */}
          <ToolbarButton label="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <span className="font-semibold">&ldquo;</span>
          </ToolbarButton>
          <ToolbarButton label="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            {"</>"}
          </ToolbarButton>

          <Separator />

          {/* ── Alignment ── */}
          <ToolbarButton label="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignIcon align="left" />
          </ToolbarButton>
          <ToolbarButton label="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignIcon align="center" />
          </ToolbarButton>
          <ToolbarButton label="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignIcon align="right" />
          </ToolbarButton>
          <ToolbarButton label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
            <AlignIcon align="justify" />
          </ToolbarButton>

          <Separator />

          {/* ── Link / Image ── */}
          <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m5-5l1.5-1.5a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656 0" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="Insert image by URL" active={false} onClick={insertImage}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 4 4 6-6 2 2M4 6h16v12H4z" />
            </svg>
          </ToolbarButton>

          <Separator />

          {/* ── Color / Highlight ── */}
          <ColorSwatchPopover
            label="Text color"
            onPick={(c) => editor.chain().focus().setColor(c).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
          <ToolbarButton label="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#854d0e" }).run()}>
            <span className="bg-yellow-700/60 text-yellow-100 px-1 rounded text-[10px]">H</span>
          </ToolbarButton>

          <Separator />

          {/* ── Tables ── */}
          <ToolbarButton label="Insert table" active={false} onClick={insertTable}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18M9 3v18M15 3v18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="Add row" active={false} onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>
            +R
          </ToolbarButton>
          <ToolbarButton label="Add column" active={false} onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>
            +C
          </ToolbarButton>
          <ToolbarButton label="Delete row" active={false} onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>
            -R
          </ToolbarButton>
          <ToolbarButton label="Delete column" active={false} onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>
            -C
          </ToolbarButton>
          <ToolbarButton label="Delete table" active={false} onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );

  // Popover component needs editor in closure — define inline.
  function ColorSwatchPopover({
    label,
    onPick,
    onClear,
  }: {
    label: string;
    onPick: (color: string) => void;
    onClear: () => void;
  }) {
    return (
      <div className="relative group">
        <ToolbarButton label={label} active={false} onClick={() => { /* handled by hover */ }}>
          <span className="inline-flex items-center gap-0.5">
            <span className="w-3 h-3 rounded-full border border-border bg-gradient-to-br from-red-400 via-amber-300 to-blue-400" />
          </span>
        </ToolbarButton>
        <div className="hidden group-hover:flex group-focus-within:flex absolute z-20 top-full left-0 mt-1 p-2 gap-1 flex-wrap w-40 rounded-md border border-border bg-surface shadow-lg">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Set color ${c}`}
              className="w-5 h-5 rounded border border-border"
              style={{ background: c }}
              onClick={() => onPick(c)}
            />
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-text-secondary px-1 py-0.5 rounded hover:bg-muted w-full text-left"
          >
            Clear color
          </button>
        </div>
      </div>
    );
  }
}

// ── Toolbar sub-components ───────────────────────────────────────────────────

interface ToolbarButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

/** Individual toolbar button with active state and accessibility label. */
function ToolbarButton({ label, active, onClick, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      className={cn(
        "flex items-center justify-center min-w-8 h-8 px-1.5 rounded text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && active && "bg-accent text-white",
        !disabled && !active && "text-text-secondary hover:text-text-primary hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

/** Visual separator between toolbar button groups. */
function Separator() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

/** Tiny alignment icon. */
function AlignIcon({ align }: { align: "left" | "center" | "right" | "justify" }) {
  const paths = {
    left: ["M3 6h18", "M3 12h12", "M3 18h16"],
    center: ["M3 6h18", "M6 12h12", "M4 18h16"],
    right: ["M3 6h18", "M9 12h12", "M5 18h16"],
    justify: ["M3 6h18", "M3 12h18", "M3 18h18"],
  }[align];
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}
