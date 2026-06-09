/**
 * AI Settings modal — shown when user clicks "See Refinement" but has no AI configured.
 * Wraps the reusable AiSettingsForm in a Modal.
 */
"use client";

import Modal from "@/app/projects/_components/modals/Modal";
import AiSettingsForm from "@/components/features/AiSettingsForm";
import type { UserAiSettingsClient } from "@/types/settings";
import { saveAiSettings } from "@/app/settings/actions";

interface AiSettingsModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close the modal without configuring. */
  onClose: () => void;
  /** Current AI settings (keys masked). */
  initialSettings: UserAiSettingsClient;
  /** Called after successful save — typically proceeds to refinement. */
  onConfigured: () => void;
}

/** Modal prompting user to configure AI settings before using refinement. */
export default function AiSettingsModal({
  open,
  onClose,
  initialSettings,
  onConfigured,
}: AiSettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Configure AI Settings" width="max-w-lg">
      <div className="px-6 pb-6">
        <p className="text-sm text-text-muted mb-5">
          To use AI-powered refinement, please configure at least one AI service
          with a valid API key.
        </p>
        <AiSettingsForm
          initialSettings={initialSettings}
          onSave={saveAiSettings}
          onSuccess={onConfigured}
          submitLabel="Save & Continue"
        />
      </div>
    </Modal>
  );
}
