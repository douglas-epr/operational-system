/**
 * Skeleton — shimmering placeholder. Replaces every "Loading…" string
 * (VibeUX 8.4).
 *
 *   <Skeleton variant="text" />            // single line
 *   <Skeleton variant="rect" h={120} />    // block
 *   <Skeleton variant="avatar" size="md" />
 */

import { clsx } from "clsx";

export type SkeletonVariant = "text" | "rect" | "avatar" | "circle";

interface SkeletonProps {
  variant?: SkeletonVariant;
  /** width in pixels OR a Tailwind w-* class via `className` */
  w?: number | string;
  h?: number | string;
  /** Avatar size, when variant="avatar" */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AVATAR_PX: Record<NonNullable<SkeletonProps["size"]>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

export default function Skeleton({
  variant = "text",
  w,
  h,
  size = "md",
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (variant === "text") {
    style.height = h ?? 12;
    style.width = w ?? "100%";
  } else if (variant === "rect") {
    style.width = w ?? "100%";
    style.height = h ?? 80;
  } else if (variant === "avatar" || variant === "circle") {
    const px = variant === "avatar" ? AVATAR_PX[size] : Number(w ?? 32);
    style.width = px;
    style.height = px;
    style.borderRadius = "50%";
  }
  return (
    <span
      aria-hidden
      className={clsx(
        "skeleton inline-block",
        variant === "text" && "rounded",
        className
      )}
      style={style}
    />
  );
}

/** Pre-built rows of skeleton text lines. */
export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          w={i === count - 1 ? "70%" : "100%"}
          h={10}
        />
      ))}
    </div>
  );
}
