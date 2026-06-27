import { marked } from "marked";
import { sanitizeHtml } from "./sanitize";

// Configure marked once at module load: GitHub-flavored markdown, and treat a
// single newline as a hard line break (the chatbot separates labelled lines with
// single newlines, so this preserves the intended layout).
marked.setOptions({ gfm: true, breaks: true });

/**
 * Convert assistant/chatbot markdown into sanitized HTML for safe rendering.
 *
 * The chatbot replies in markdown (headings, **bold**, bullet lists, [links]),
 * but the message panes render via dangerouslySetInnerHTML — so the raw markdown
 * shows verbatim unless we convert it to HTML first. We then run the result
 * through the shared DOMPurify allow-list before it reaches the DOM.
 */
export function renderMarkdownToSafeHtml(markdown: string | null | undefined): string {
  if (!markdown) return "";
  // `async: false` guarantees a string return (no async marked extensions are used).
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(html);
}
