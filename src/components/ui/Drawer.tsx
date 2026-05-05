"use client";

/**
 * Drawer — slide-in panel from the right (or left). Used for
 * medium-volume edit views per VibeUX 4.6 (popup→drawer→page sizing).
 */

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { CloseIcon } from "./icons";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left";
  /** Tailwind width class (defaults `w-[480px]`). */
  width?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  zIndex?: 50 | 60 | 70;
}

const Z_OVERLAY: Record<50 | 60 | 70, string> = {
  50: "z-50",
  60: "z-[60]",
  70: "z-[70]",
};

export default function Drawer({
  open,
  onClose,
  side = "right",
  width = "w-[480px] max-w-[95vw]",
  title,
  subtitle,
  children,
  zIndex = 50,
}: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={clsx(
        "fixed inset-0 flex bg-black/55 backdrop-blur-[2px]",
        side === "right" ? "justify-end" : "justify-start",
        Z_OVERLAY[zIndex]
      )}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          width,
          "h-full bg-elevated border-border shadow-[0_24px_48px_rgba(0,0,0,0.35)] flex flex-col",
          side === "right" ? "border-l" : "border-r"
        )}
      >
        {(title || subtitle) && (
          <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border-subtle shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 className="text-heading-2 text-text-primary tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-text-muted mt-1">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 p-1.5 -mr-1.5 -mt-1.5 text-text-muted hover:text-text-primary hover:bg-muted rounded-md transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}
