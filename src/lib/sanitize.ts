import DOMPurify from "isomorphic-dompurify";
import type { Config } from "dompurify";

// Tags actually emitted by the two TipTap wrappers (design-system.md "Rich
// text") plus the pre-existing allow-list. `hr`/`mark`/`sub`/`sup`/`img` were
// added for the TipTap StarterKit horizontal rule, multicolor Highlight mark,
// Subscript/Superscript extensions, and the Image extension respectively —
// verified against src/components/editor/RichTextEditor.tsx and
// src/app/ideas-refiner/_components/RichTextEditor.tsx. `figure`/`figcaption`/
// `tfoot` were deliberately NOT added: neither editor emits them today.
const SAFE_TAGS = [
  "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "mark", "sub", "sup",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "code", "pre", "blockquote",
  "span", "div", "img",
  "table", "thead", "tbody", "tr", "th", "td",
];

// `style` covers TextAlign (`text-align`), TextStyle/Color (`color`), and
// Highlight (`background-color`) inline styles emitted by both editors.
// DOMPurify sanitizes the style attribute's contents itself (strips
// `expression()`, `url(javascript:...)`, etc.) rather than us maintaining a
// CSS property allow-list here.
// `colspan`/`rowspan`/`colwidth`/`align` cover the resizable Table extension;
// `src`/`alt`/`title` cover the Image extension.
const SAFE_ATTRS = [
  "href", "target", "rel", "class",
  "src", "alt", "title",
  "colspan", "rowspan", "colwidth", "align",
  "style",
];

const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: SAFE_TAGS,
  ALLOWED_ATTR: SAFE_ATTRS,
};

// DOMPurify does not deeply parse CSS inside a `style` attribute value (it
// only strips <style>/<script> tag content and dangerous DOM attributes).
// Modern browsers no longer execute `javascript:`/`expression()` from CSS,
// but this hook belts-and-braces the constrained TipTap style usage
// (color/background-color/text-align) against it and against `url()`/
// `@import`/`-moz-binding` payloads, since we intentionally allow `style`.
const DANGEROUS_STYLE_RE = /javascript:|expression\s*\(|url\s*\(|@import|-moz-binding/i;
DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if (data.attrName === "style" && DANGEROUS_STYLE_RE.test(data.attrValue)) {
    data.keepAttr = false;
  }
});

/**
 * Strip unsafe HTML using DOMPurify. Runs identically on the server (via
 * isomorphic-dompurify, which sanitizes through jsdom when there's no real
 * DOM) and in the browser — there is no SSR no-op branch, so every render
 * path (RSC, route handler, or client component) is sanitized the same way.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}
