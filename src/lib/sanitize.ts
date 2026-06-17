import type { Config } from "dompurify";

const SAFE_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "code", "pre", "blockquote",
  "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
];

const SAFE_ATTRS = ["href", "target", "rel", "class"];

const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: SAFE_TAGS,
  ALLOWED_ATTR: SAFE_ATTRS,
};

/**
 * Strip unsafe HTML using DOMPurify (browser-only; on the server returns
 * the input as-is since messages come from trusted LLM/server sources).
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  // Lazy import to avoid SSR bundle issues.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify") as typeof import("dompurify").default;
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}
