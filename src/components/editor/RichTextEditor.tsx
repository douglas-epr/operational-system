"use client";

/**
 * Shared TipTap-based rich text editor. Used by both SOPs and the /docs
 * Playbook tab. Consumers provide initial HTML, an optional change callback,
 * extra extensions (e.g. `CommentMarkExtension` for anchored comments), and
 * a slot for action buttons on the right of the top bar.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  useEditor,
  EditorContent,
  type Editor,
  type AnyExtension,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

export interface RichTextEditorSelection {
  from: number;
  to: number;
  text: string;
  rect: DOMRect | null;
}

export interface RichTextEditorProps {
  initialHtml: string;
  editable?: boolean;
  extraExtensions?: AnyExtension[];
  onChange?: (html: string) => void;
  onSelectionChange?: (sel: RichTextEditorSelection) => void;
  /** Optional header title (usually the doc name). */
  title?: string;
  /** Slot to place buttons to the right of the title. */
  toolbarRight?: React.ReactNode;
  /** Optional additional toolbar buttons (rendered after the built-in ones). */
  extraToolbar?: (editor: Editor) => React.ReactNode;
  className?: string;
  /** Hide the built-in toolbar entirely. */
  hideToolbar?: boolean;
  /** Hide the footer that shows the block type + word count. */
  hideFooter?: boolean;
}

export interface RichTextEditorHandle {
  getHTML: () => string;
  setContent: (html: string) => void;
  getEditor: () => Editor | null;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      initialHtml,
      editable = true,
      extraExtensions,
      onChange,
      onSelectionChange,
      title,
      toolbarRight,
      extraToolbar,
      className,
      hideToolbar,
      hideFooter,
    },
    ref
  ) {
    const skipContentSync = useRef(true);
    const lastInitialHtml = useRef(initialHtml);

    const editor = useEditor({
      editable,
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        CharacterCount,
        Link.configure({ openOnClick: false }),
        Image,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        ...(extraExtensions ?? []),
      ],
      content: initialHtml,
      editorProps: {
        attributes: { class: "focus:outline-none" },
      },
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        if (!onSelectionChange) return;
        const { from, to } = editor.state.selection;
        if (from === to) {
          onSelectionChange({ from, to, text: "", rect: null });
          return;
        }
        const text = editor.state.doc.textBetween(from, to, " ");
        let rect: DOMRect | null = null;
        const sel = typeof window !== "undefined" ? window.getSelection() : null;
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const r = range.getBoundingClientRect();
          if (r.width > 0 || r.height > 0) rect = r;
        }
        onSelectionChange({ from, to, text, rect });
      },
    });

    // Sync content when `initialHtml` changes *externally* (e.g. version switch)
    useEffect(() => {
      if (skipContentSync.current) {
        skipContentSync.current = false;
        lastInitialHtml.current = initialHtml;
        return;
      }
      if (editor && initialHtml !== lastInitialHtml.current) {
        editor.commands.setContent(initialHtml);
        lastInitialHtml.current = initialHtml;
      }
    }, [initialHtml, editor]);

    useEffect(() => {
      if (editor) editor.setEditable(editable);
    }, [editable, editor]);

    useImperativeHandle(
      ref,
      (): RichTextEditorHandle => ({
        getHTML: () => editor?.getHTML() ?? "",
        setContent: (html: string) => {
          editor?.commands.setContent(html);
          lastInitialHtml.current = html;
        },
        getEditor: () => editor,
      }),
      [editor]
    );

    if (!editor) return null;

    const wordCount = editor.storage.characterCount?.words?.() ?? 0;

    return (
      <div className={`h-full flex flex-col overflow-hidden ${className ?? ""}`}>
        {(title || toolbarRight) && (
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border shrink-0 flex-wrap bg-surface">
            {title ? (
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            ) : (
              <div />
            )}
            {toolbarRight && (
              <div className="flex items-center gap-3 flex-wrap">{toolbarRight}</div>
            )}
          </div>
        )}

        {!hideToolbar && editable && (
          <EditorToolbar editor={editor} extraToolbar={extraToolbar} />
        )}

        <div
          className="flex-1 overflow-y-auto tiptap-content"
          onClick={() => editor.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>

        {!hideFooter && (
          <div className="flex items-center justify-between px-8 py-2 border-t border-border text-xs text-text-muted shrink-0 bg-surface">
            <span>
              {editor.isActive("heading")
                ? "Heading " + (editor.getAttributes("heading").level ?? "")
                : "Paragraph"}
            </span>
            <span>
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    );
  }
);

// ── Toolbar ────────────────────────────────────────────────────────────────────

function EditorToolbar({
  editor,
  extraToolbar,
}: {
  editor: Editor;
  extraToolbar?: (editor: Editor) => React.ReactNode;
}) {
  const btn = (
    active: boolean,
    onClick: () => void,
    title: string,
    children: React.ReactNode
  ) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-accent/20 text-accent"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );

  const sep = () => <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-1.5 border-b border-border bg-elevated shrink-0">
      {btn(
        false,
        () => editor.chain().focus().undo().run(),
        "Undo",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
      )}
      {btn(
        false,
        () => editor.chain().focus().redo().run(),
        "Redo",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>
      )}
      {sep()}

      <select
        value={
          editor.isActive("heading")
            ? String(editor.getAttributes("heading").level)
            : "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .toggleHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 })
              .run();
        }}
        className="text-xs bg-muted border border-border rounded px-1.5 py-1 text-text-secondary focus:outline-none focus:border-accent"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
      </select>
      {sep()}

      {btn(editor.isActive("bold"),        () => editor.chain().focus().toggleBold().run(),        "Bold",        <strong className="font-bold">B</strong>)}
      {btn(editor.isActive("italic"),      () => editor.chain().focus().toggleItalic().run(),      "Italic",      <em>I</em>)}
      {btn(editor.isActive("underline"),   () => editor.chain().focus().toggleUnderline().run(),   "Underline",   <span className="underline">U</span>)}
      {btn(editor.isActive("strike"),      () => editor.chain().focus().toggleStrike().run(),      "Strikethrough", <span className="line-through">S</span>)}
      {btn(editor.isActive("subscript"),   () => editor.chain().focus().toggleSubscript().run(),   "Subscript",   <span>X<sub>2</sub></span>)}
      {btn(editor.isActive("superscript"), () => editor.chain().focus().toggleSuperscript().run(), "Superscript", <span>X<sup>2</sup></span>)}
      {sep()}

      {btn(editor.isActive({ textAlign: "left" }),    () => editor.chain().focus().setTextAlign("left").run(),    "Align left",    <AlignLeft />)}
      {btn(editor.isActive({ textAlign: "center" }),  () => editor.chain().focus().setTextAlign("center").run(),  "Align center",  <AlignCenter />)}
      {btn(editor.isActive({ textAlign: "right" }),   () => editor.chain().focus().setTextAlign("right").run(),   "Align right",   <AlignRight />)}
      {btn(editor.isActive({ textAlign: "justify" }), () => editor.chain().focus().setTextAlign("justify").run(), "Justify",       <AlignJustify />)}
      {sep()}

      {btn(editor.isActive("bulletList"),  () => editor.chain().focus().toggleBulletList().run(),  "Bullet list",  <ListBullet />)}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Ordered list", <ListOrdered />)}
      {sep()}

      {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Blockquote",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
      )}
      {btn(editor.isActive("code"),      () => editor.chain().focus().toggleCode().run(),      "Inline code",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
      )}
      {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), "Code block",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      )}
      {sep()}

      <label title="Text color" className="relative p-1.5 rounded cursor-pointer text-text-secondary hover:bg-muted hover:text-text-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <input
          type="color"
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
        />
      </label>

      {btn(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight().run(), "Highlight",
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 2.1L11.37 6.22l-.01.01L6.35 11.25l-.01.01L4 17l3 3 5.74-2.34.01-.01 5.02-5.02.01-.01 4.12-4.12L15.5 2.1zm-3.49 14.05L8 18l-2-2 1.86-4.01L13.28 6.6l3.12 3.12-4.39 6.53z"/></svg>
      )}

      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), "Horizontal rule",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14"/></svg>
      )}
      {sep()}

      {btn(false, () => {
        const url = window.prompt("Image URL");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }, "Insert image (URL)",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4a3 3 0 014 0l4 4m-2-2l1-1a3 3 0 014 0l3 3M4 6h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm12 4a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      )}
      {sep()}

      {btn(false, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), "Insert 3x3 table",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18M9 4v16M15 4v16"/></svg>
      )}
      {btn(false, () => editor.chain().focus().addRowAfter().run(), "Add row below",
        <span className="text-[10px] font-bold">+R</span>
      )}
      {btn(false, () => editor.chain().focus().addColumnAfter().run(), "Add column after",
        <span className="text-[10px] font-bold">+C</span>
      )}
      {btn(false, () => editor.chain().focus().deleteRow().run(), "Delete row",
        <span className="text-[10px] font-bold">-R</span>
      )}
      {btn(false, () => editor.chain().focus().deleteColumn().run(), "Delete column",
        <span className="text-[10px] font-bold">-C</span>
      )}
      {btn(false, () => editor.chain().focus().deleteTable().run(), "Delete table",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
      )}

      {extraToolbar ? extraToolbar(editor) : null}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const AlignLeft    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h15"/></svg>;
const AlignCenter  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M4 18h16"/></svg>;
const AlignRight   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M6 18h15"/></svg>;
const AlignJustify = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18"/></svg>;
const ListBullet   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
const ListOrdered  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01"/></svg>;
