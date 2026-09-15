/**
 * Root-level 404. Applies to any URL that doesn't match a route.
 * Chrome-less (no `PageShell`) for the same reason as `loading.tsx` — it
 * can render for anonymous visitors who never had a profile to pass in.
 */
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <EmptyState
        icon={<SearchIcon />}
        title="Page not found"
        body="The page you're looking for doesn't exist or may have been moved."
        action={
          <Link href="/projects" className="btn btn-primary">
            Back to Projects
          </Link>
        }
      />
    </div>
  );
}
