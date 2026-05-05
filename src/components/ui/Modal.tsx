"use client";

/**
 * Modal — canonical overlay primitive for the entire app.
 *
 * Lifted from `src/app/projects/_components/modals/Modal.tsx`. The old
 * path now re-exports this so existing imports keep working during the
 * migration.
 *
 *   <Modal open={o} onClose={…} title="Edit project" size="lg">
 *     <ModalBody>…</ModalBody>
 *     <ModalFooter>
 *       <Button variant="tertiary" onClick={…}>Cancel</Button>
 *       <Button onClick={…}>Save</Button>
 *     </ModalFooter>
 *   </Modal>
 */

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { CloseIcon } from "./icons";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: ModalSize;
  /**
   * Stacking layer. Use 50 (default) for top-level modals, 60 for one
   * level of nested modals, and 70 for double-nested modals.
   */
  zIndex?: 50 | 60 | 70;
  /** Extra raw class for overrides */
  className?: string;
  children: React.ReactNode;
  /** Disable closing on backdrop click */
  disableBackdropClose?: boolean;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm:  "max-w-md",
  md:  "max-w-xl",
  lg:  "max-w-2xl",
  xl:  "max-w-4xl",
  "2xl": "max-w-6xl",
};

const Z_OVERLAY: Record<50 | 60 | 70, string> = {
  50: "z-50",
  60: "z-[60]",
  70: "z-[70]",
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  zIndex = 50,
  className,
  disableBackdropClose,
  children,
}: ModalProps) {
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
        "fixed inset-0 flex items-center justify-center p-4",
        "bg-black/55 backdrop-blur-[2px]",
        Z_OVERLAY[zIndex]
      )}
      onMouseDown={(e) => {
        if (!disableBackdropClose && e.target === overlayRef.current) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={clsx(
          "relative w-full bg-elevated rounded-lg border border-border flex flex-col max-h-[90vh]",
          "shadow-[0_24px_48px_rgba(0,0,0,0.35),_0_8px_16px_rgba(0,0,0,0.18)]",
          SIZE_CLASS[size],
          className
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
        {!title && !subtitle && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary hover:bg-muted rounded-md transition-colors z-10"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}

        {children}
      </div>
    </div>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex-1 overflow-y-auto min-h-0 px-6 py-5", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={clsx(
        "flex items-center justify-end gap-2 px-6 py-4 border-t border-border-subtle shrink-0",
        className
      )}
    >
      {children}
    </footer>
  );
}
