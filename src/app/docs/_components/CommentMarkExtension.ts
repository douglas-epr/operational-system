/**
 * TipTap Mark that anchors a playbook comment to a range of text. The mark
 * renders as `<span data-comment-id="…" class="comment-highlight">`. Clicking
 * inside the span dispatches a `playbook-comment-click` CustomEvent whose
 * detail is the comment id — the thread panel listens for this to open the
 * matching thread.
 */

import { Mark, mergeAttributes } from "@tiptap/core";

export const COMMENT_CLICK_EVENT = "playbook-comment-click";

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    playbookComment: {
      setPlaybookComment: (commentId: string) => ReturnType;
      unsetPlaybookComment: () => ReturnType;
    };
  }
}

export const CommentMarkExtension = Mark.create<CommentMarkOptions>({
  name: "playbookComment",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-comment-id"),
        renderHTML: (attrs) => {
          if (!attrs.commentId) return {};
          return { "data-comment-id": attrs.commentId };
        },
      },
      // NOTE: `data-status` is intentionally NOT a managed mark attribute.
      // If ProseMirror rendered `data-status` from the mark, it would
      // overwrite whatever `paint()` in PlaybookEditor stamps — and the
      // stored HTML has stale values ("pending" even for solved comments).
      // We leave `data-status` off the mark spec so PM doesn't touch it,
      // and let `paint()` be the single source of truth for that attribute.
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { class: "comment-highlight" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setPlaybookComment:
        (commentId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { commentId }),
      unsetPlaybookComment:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },

  addProseMirrorPlugins() {
    return [];
  },

  onCreate() {
    if (typeof window === "undefined") return;
    const dom = this.editor.view.dom as HTMLElement;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const span = target.closest<HTMLElement>("span[data-comment-id]");
      if (!span) return;
      const id = span.getAttribute("data-comment-id");
      if (!id) return;
      // Defense-in-depth: when the wrapper is in "hide resolved" mode AND
      // this span is solved, swallow the click. The CSS already sets
      // pointer-events: none, but a JS guard keeps us correct even if
      // styles fail to load or are overridden by user stylesheets.
      const status = span.getAttribute("data-status");
      const wrapper = span.closest<HTMLElement>(".playbook-editor-wrapper");
      if (status === "solved" && wrapper?.getAttribute("data-hide-resolved") === "true") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      window.dispatchEvent(
        new CustomEvent(COMMENT_CLICK_EVENT, { detail: { commentId: id } })
      );
    };
    dom.addEventListener("click", handler);
    (dom as unknown as { __commentClickHandler?: EventListener }).__commentClickHandler = handler;
  },

  onDestroy() {
    if (typeof window === "undefined") return;
    const dom = this.editor.view.dom as HTMLElement;
    const handler = (dom as unknown as { __commentClickHandler?: EventListener })
      .__commentClickHandler;
    if (handler) dom.removeEventListener("click", handler);
  },
});
