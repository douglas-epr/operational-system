"use client";

/**
 * Lazy-loaded wrapper around the Ideas Refiner TipTap editor
 * (`./RichTextEditor`, ~20 `@tiptap/*` packages). None of this editor's
 * callers hold a ref/imperative handle (it has no `forwardRef`), so unlike
 * the shared `@/components/editor/RichTextEditor`, every call site can
 * safely move to this dynamic wrapper.
 */
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

interface RichTextEditorLazyProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

function EditorSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-base overflow-hidden">
      <div className="h-9 border-b border-border bg-surface" />
      <div className="p-3">
        <Skeleton variant="rect" h={140} />
      </div>
    </div>
  );
}

const RichTextEditor = dynamic<RichTextEditorLazyProps>(
  () => import("./RichTextEditor"),
  { ssr: false, loading: EditorSkeleton }
);

export default RichTextEditor;
