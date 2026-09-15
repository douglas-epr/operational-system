import sanitizeHtmlLib from "sanitize-html";

/**
 * HTML sanitizer for every `dangerouslySetInnerHTML` sink in the app.
 *
 * Why `sanitize-html` and not DOMPurify: DOMPurify needs a DOM, so on the
 * server it has to be wrapped (isomorphic-dompurify) which pulls in jsdom.
 * jsdom cannot run on Cloudflare Workers — it needs Node's `vm`, `fs` and
 * `net` — so the Cloudflare migration (2026-09-15) required a sanitizer with
 * no DOM dependency. `sanitize-html` parses with htmlparser2, which is pure
 * JavaScript and runs unchanged on Workers, Node, and the browser.
 *
 * One implementation serves every render path — RSC, route handler, and client
 * component — so there is a single allow-list to audit and no chance of the
 * server and client rules drifting apart.
 *
 * `dompurify` is still a dependency: LogoPickerModal and VisualStylesStep call
 * it directly with an SVG profile, and both are browser-only components.
 */

// Tags actually emitted by the two TipTap wrappers (design-system.md "Rich
// text") plus the pre-existing allow-list. `hr`/`mark`/`sub`/`sup`/`img` cover
// the StarterKit horizontal rule, the multicolor Highlight mark, the
// Subscript/Superscript extensions, and the Image extension respectively.
// `figure`/`figcaption`/`tfoot` are deliberately absent: neither editor emits
// them today.
const SAFE_TAGS = [
  "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "mark", "sub", "sup",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "code", "pre", "blockquote",
  "span", "div", "img",
  "table", "thead", "tbody", "tr", "th", "td",
];

// `colspan`/`rowspan`/`colwidth`/`align` cover the resizable Table extension;
// `src`/`alt`/`title` cover the Image extension.
const SAFE_ATTRS = [
  "href", "target", "rel", "class",
  "src", "alt", "title",
  "colspan", "rowspan", "colwidth", "align",
  "style",
];

// Inline styles are allowed only for the three properties the editors actually
// emit: TextAlign (`text-align`), TextStyle/Color (`color`) and Highlight
// (`background-color`). This is an allow-list of CSS properties with a value
// pattern per property, which is strictly tighter than the regex denylist it
// replaced — a payload like `url(javascript:...)` or `expression(...)` matches
// no permitted value shape, so it is dropped rather than pattern-hunted.
const SAFE_STYLES: sanitizeHtmlLib.IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^(left|right|center|justify|start|end)$/],
    color: [
      /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
      /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i,
      /^[a-z]{3,20}$/i, // named colors, e.g. "rebeccapurple"
    ],
    "background-color": [
      /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
      /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i,
      /^[a-z]{3,20}$/i,
    ],
  },
};

const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: SAFE_TAGS,
  allowedAttributes: { "*": SAFE_ATTRS },
  allowedStyles: SAFE_STYLES,
  // Only these URL schemes may appear in href/src. `data:` is permitted for
  // img src alone, because the editors inline pasted images that way; allowing
  // it on `a href` would enable data:text/html navigation.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  // Drop the contents of disallowed tags rather than reflowing them as text,
  // so a stripped <script> cannot leave its body visible on the page.
  nonTextTags: ["script", "style", "textarea", "option", "noscript"],
  // Anything opening a new tab must not get access to window.opener.
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
    }),
  },
};

/**
 * Strip unsafe HTML. Runs identically on the server and in the browser, so
 * every render path is sanitized by the same rules.
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, OPTIONS);
}
