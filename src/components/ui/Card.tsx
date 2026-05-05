/**
 * Card — single elevated surface primitive.
 *
 *   <Card>…</Card>
 *   <Card size="sm" interactive onClick={…}>…</Card>
 *   <Card>
 *     <CardHeader title="Revenue" subtitle="Last 30 days" />
 *     <CardBody>…</CardBody>
 *   </Card>
 */

import { clsx } from "clsx";

export type CardSize = "sm" | "md" | "lg" | "compact";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: CardSize;
  interactive?: boolean;
  as?: "div" | "article" | "section";
}

const SIZE_CLASS: Record<CardSize, string> = {
  sm: "card-sm",
  md: "",
  lg: "card-lg",
  compact: "card-compact",
};

export default function Card({
  size = "md",
  interactive,
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={clsx(
        "card",
        SIZE_CLASS[size],
        interactive && "card-interactive",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <header
      className={clsx(
        "flex items-start justify-between gap-3 mb-3",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-heading-3 text-text-primary tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("min-w-0", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={clsx(
        "flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border",
        className
      )}
    >
      {children}
    </footer>
  );
}
