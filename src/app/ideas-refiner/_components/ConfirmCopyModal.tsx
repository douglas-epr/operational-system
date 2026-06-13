"use client";

import { useState, useTransition } from "react";
import Modal from "@/app/projects/_components/modals/Modal";

interface ConfirmCopyModalProps {
  open: boolean;
  onClose: () => void;
  ideaName: string;
  onConfirm: () => Promise<{ error?: string }>;
}

export default function ConfirmCopyModal({
  open,
  onClose,
  ideaName,
  onConfirm,
}: ConfirmCopyModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-md">
      <div className="px-6 py-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Duplicate idea?</h2>
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm text-text-secondary">
            You are about to create a copy of{" "}
            <span className="font-bold text-text-primary">{ideaName}</span>.
          </p>
          <p className="text-sm text-text-secondary">
            A new idea version will be created with all data — ICPs, benchmarking, strategic
            frameworks, report, PRD, and everything else — copied from the original. The
            original idea will remain unchanged.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
        <button
          onClick={onClose}
          disabled={isPending}
          className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-md bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {isPending ? "Copying…" : "Duplicate"}
        </button>
      </div>
    </Modal>
  );
}
