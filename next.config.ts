import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack doesn't pick up
  // C:\Users\dougl\package-lock.json (which causes Tailwind v4 to scan files
  // outside the repo and choke on non-UTF-8 candidates — "Invalid code point"
  // errors in markUsedVariable).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Baseline security headers (defense-in-depth), now with HSTS and a
  // Report-Only CSP (2026-09-15 security pass). A full ENFORCING
  // Content-Security-Policy with per-request nonces is intentionally NOT
  // set here — the app has an inline theme script and the /m landing
  // renders a srcDoc iframe, so CSP needs a dedicated nonce pass before it
  // can be enabled without breaking those. Report-Only is enabled now so we
  // collect real violation data before authoring the enforcing policy.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            // `preload` intentionally omitted: submitting to the browser HSTS preload list is
            // slow to reverse and binds the apex domain. Add it deliberately, not by default.
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://openrouter.ai https://api.brevo.com",
              "frame-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Strip console.* from the production bundle, but keep console.error —
  // several intentional error-path logs (6 call sites) must survive.
  compiler: {
    removeConsole: { exclude: ["error"] },
  },
};

export default nextConfig;
