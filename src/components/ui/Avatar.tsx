/**
 * Avatar — single primitive for every user/profile image in the app.
 *
 * Render order: image (if `src`) → initials (from `name`) → "—".
 * Sizes follow the design-system scale: xs/sm/md/lg/xl.
 */

import { clsx } from "clsx";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-10 h-10 text-xs",
  xl: "w-16 h-16 text-base",
};

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  /** Override avatar background. Defaults to bg-accent for solid fallback. */
  variant?: "accent" | "muted";
  className?: string;
  /** Render as a button-like element (cursor pointer + hover ring). */
  interactive?: boolean;
}

function initialsOf(name?: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = "md",
  variant = "accent",
  className,
  interactive,
}: AvatarProps) {
  const fallback = (
    <span className="leading-none font-semibold select-none">
      {initialsOf(name)}
    </span>
  );

  const bg =
    variant === "accent"
      ? "bg-accent text-white"
      : "bg-muted text-text-secondary";

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ring-1 ring-border/40",
        SIZE_CLASS[size],
        bg,
        interactive && "cursor-pointer hover:ring-2 hover:ring-accent/50 transition-shadow",
        className
      )}
      aria-label={name ?? undefined}
      title={name ?? undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="w-full h-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
}

interface AvatarStackProps {
  people: Array<{ id: string; name?: string | null; src?: string | null }>;
  size?: AvatarSize;
  max?: number;
  className?: string;
}

/** Overlapping avatars with `+N` overflow chip. */
export function AvatarStack({
  people,
  size = "sm",
  max = 4,
  className,
}: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = Math.max(0, people.length - max);

  const overlap: Record<AvatarSize, string> = {
    xs: "-ml-1.5",
    sm: "-ml-1.5",
    md: "-ml-2",
    lg: "-ml-2.5",
    xl: "-ml-3",
  };

  return (
    <div className={clsx("flex items-center", className)}>
      {shown.map((p, i) => (
        <Avatar
          key={p.id}
          name={p.name}
          src={p.src}
          size={size}
          className={clsx(i > 0 && overlap[size], "ring-2 ring-bg-elevated")}
        />
      ))}
      {overflow > 0 && (
        <div
          className={clsx(
            SIZE_CLASS[size],
            "inline-flex items-center justify-center rounded-full bg-muted text-text-secondary font-semibold ring-2 ring-bg-elevated leading-none",
            overlap[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
