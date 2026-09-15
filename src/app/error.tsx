"use client";

/**
 * Root-level route error boundary. Catches any error thrown while
 * rendering/fetching in a route segment that doesn't define its own
 * `error.tsx`. Chrome-less (no `PageShell`) since the error may have
 * happened before a profile was ever fetched.
 *
 * Only a short, static, safe message is shown — never `error.message` or
 * a stack trace (both can carry internal details). The real error is
 * logged server/browser-side via `console.error` for debugging.
 */
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ErrorIcon } from "@/components/ui/icons";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center">
          <ErrorIcon className="w-7 h-7" />
        </div>
        <h1 className="text-base font-semibold text-text-primary">Something went wrong</h1>
        <p className="text-sm text-text-muted">
          An unexpected error occurred loading this page. You can try again, or head back to Projects.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link href="/projects" className="btn btn-secondary">
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
