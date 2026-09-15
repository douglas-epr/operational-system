"use client";

/**
 * Catches errors thrown by the root layout itself (rare — `error.tsx`
 * only catches errors in `page.tsx`/nested layouts, not `layout.tsx`).
 * Next.js requires this file to render its own `<html>`/`<body>` since
 * the root layout is bypassed entirely when this boundary is hit.
 *
 * Because the root layout (and its `ThemeScript`/`next/font` variables)
 * never renders in this path, we re-import the global stylesheet directly
 * so the design tokens are still available, and we don't attempt to
 * apply the light/dark class — this fallback always renders in the
 * default (dark) token set.
 */
import { useEffect } from "react";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-base flex items-center justify-center px-6">
          <div className="max-w-sm w-full flex flex-col items-center text-center gap-3">
            <h1 className="text-base font-semibold text-text-primary">
              Something went wrong
            </h1>
            <p className="text-sm text-text-muted">
              A critical error occurred and this page couldn&apos;t load. Please
              try again.
            </p>
            <button type="button" onClick={reset} className="btn btn-primary mt-2">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
