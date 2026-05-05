/**
 * PageHeader — title + subtitle/eyebrow + right-side actions row.
 * Used as the first child of `<PageShell>`.
 *
 *   <PageHeader
 *     title="Projects"
 *     subtitle="22 active across 4 programs"
 *     actions={<Button leadingIcon={<AddIcon />}>New project</Button>}
 *   />
 */

import { clsx } from "clsx";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  /** Tighter spacing — useful when the page renders a toolbar right after. */
  compact?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  compact,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={clsx(
        "flex items-end justify-between flex-wrap gap-4",
        compact ? "mb-4" : "mb-6",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-label mb-1.5">{eyebrow}</div>
        )}
        <h1 className="text-heading-1 text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </header>
  );
}
