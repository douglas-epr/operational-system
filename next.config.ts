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
  // Baseline security headers (defense-in-depth). A full Content-Security-Policy
  // with per-request nonces is intentionally NOT set here — the app has an inline
  // theme script and the /m landing renders a srcDoc iframe, so CSP needs a
  // dedicated nonce pass before it can be enabled without breaking those.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
