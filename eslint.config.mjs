import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloudflare Workers build output (/cloudflare) — bundled
    // third-party JS, not source; linting it produced 16k false positives.
    ".open-next/**",
    // Vendored third-party bundle (html-docx-js UMD build) — minified upstream
    // code, not ours to lint. Loaded at runtime by src/lib/load-html-docx.ts.
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
