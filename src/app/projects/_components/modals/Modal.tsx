/**
 * Legacy import path — re-exports the canonical Modal primitive.
 *
 * Old API supported: `width="max-w-2xl"` (raw Tailwind class). The new
 * canonical Modal takes `size="lg"` etc. We translate the old prop into
 * the new size enum so existing call sites keep working during the
 * page-by-page migration. New code should import from
 * `@/components/ui/Modal`.
 */

"use client";

import CanonicalModal, {
  ModalBody,
  ModalFooter,
  type ModalSize,
} from "@/components/ui/Modal";

interface LegacyModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Legacy prop — Tailwind max-w-* class, e.g. "max-w-2xl". */
  width?: string;
  zIndex?: 50 | 60 | 70;
}

const WIDTH_TO_SIZE: Record<string, ModalSize> = {
  "max-w-md":  "sm",
  "max-w-xl":  "md",
  "max-w-2xl": "lg",
  "max-w-4xl": "xl",
  "max-w-6xl": "2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-xl",
  zIndex = 50,
}: LegacyModalProps) {
  const size = WIDTH_TO_SIZE[width] ?? "md";
  return (
    <CanonicalModal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      zIndex={zIndex}
    >
      {children}
    </CanonicalModal>
  );
}

export { ModalBody, ModalFooter };
