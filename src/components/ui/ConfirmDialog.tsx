"use client";

/**
 * ConfirmDialog — small modal that asks the user to confirm a
 * destructive or significant action (VibeUX 4.10–4.14).
 *
 *   <ConfirmDialog
 *     open={confirm}
 *     onClose={() => setConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Delete project"
 *     body="This will permanently remove the project and all its tasks."
 *     confirmLabel="Delete"
 *     destructive
 *   />
 */

import { useState } from "react";
import Modal, { ModalBody, ModalFooter } from "./Modal";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading: externalLoading,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  async function handleConfirm() {
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {body && <ModalBody>{body}</ModalBody>}
      <ModalFooter>
        <Button variant="tertiary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "primary"}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
