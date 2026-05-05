"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  /** "project" | "task" | "idea" */
  kind: "project" | "task" | "idea";
  itemName: string;
  onConfirm: () => Promise<{ error?: string }>;
}

export default function ConfirmDeleteModal({
  open,
  onClose,
  kind,
  itemName,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-md">
      <div className="px-6 py-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Are you sure?</h2>
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm text-text-secondary">
            You are about to delete the {kind}{" "}
            <span className="font-bold text-text-primary">{itemName}</span>.
          </p>
          <p className="text-sm text-text-secondary">
            This {kind} will be permanently removed
            {kind === "task"
              ? " and all sub-tasks, if there are any."
              : kind === "idea"
                ? " along with all associated ICPs, benchmarking, PRD, and generated data."
                : " and all tasks."}
          </p>
          <p className="text-sm text-text-secondary">Are you sure you want to proceed?</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
