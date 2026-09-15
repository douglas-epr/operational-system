/**
 * Browser-only loader for html-docx-js.
 *
 * Why this exists instead of `await import("html-docx-js/dist/html-docx")`:
 * html-docx-js is written with legacy `with` statements, which esbuild refuses
 * to emit as ESM ("With statements cannot be used with the esm output format
 * due to strict mode"). That breaks the Cloudflare Workers build. Even with
 * `serverExternalPackages`, OpenNext still bundles the traced copy from
 * node_modules, and its `edgeExternals` option only covers the config compile,
 * not the server function — so there is no configuration route around it.
 *
 * The library is only ever reached from a user clicking "export DOCX", so it
 * never needs to be in any server bundle. Loading the UMD build from
 * `/vendor/html-docx.js` as a plain script keeps it entirely out of the module
 * graph: no bundler traces it, the Workers build succeeds, and DOCX export
 * keeps working unchanged.
 *
 * The file is a checked-in copy of `html-docx-js/dist/html-docx.js`. It is
 * served from our own origin, so it satisfies the `script-src 'self'` CSP in
 * next.config.ts without needing a CDN allowance. Refresh it with:
 *   cp node_modules/html-docx-js/dist/html-docx.js public/vendor/html-docx.js
 */

/** Converts an HTML string into a Word-compatible Blob. */
export type HtmlDocxAsBlob = (html: string) => Blob;

interface HtmlDocxGlobal {
  asBlob?: HtmlDocxAsBlob;
}

const SCRIPT_SRC = "/vendor/html-docx.js";

// One in-flight promise shared by every caller, so clicking export in two
// modals does not inject the script twice.
let loader: Promise<HtmlDocxAsBlob> | null = null;

function readGlobal(): HtmlDocxAsBlob | null {
  const candidate = (window as unknown as { htmlDocx?: HtmlDocxGlobal }).htmlDocx;
  return typeof candidate?.asBlob === "function" ? candidate.asBlob : null;
}

/**
 * Resolves with html-docx-js's `asBlob`, injecting the vendored script on first
 * use. Rejects if called outside the browser or if the script fails to load —
 * callers already surface an export error to the user.
 */
export function loadHtmlDocx(): Promise<HtmlDocxAsBlob> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("loadHtmlDocx is browser-only; DOCX export cannot run on the server.")
    );
  }

  const already = readGlobal();
  if (already) return Promise.resolve(already);

  if (loader) return loader;

  loader = new Promise<HtmlDocxAsBlob>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      const asBlob = readGlobal();
      if (asBlob) {
        resolve(asBlob);
      } else {
        // Reset so a later attempt can retry rather than reusing a dead promise.
        loader = null;
        reject(new Error("html-docx-js loaded but did not expose asBlob."));
      }
    };
    const onError = () => {
      loader = null;
      reject(new Error(`Failed to load ${SCRIPT_SRC}.`));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return loader;
}
