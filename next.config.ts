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
};

export default nextConfig;
