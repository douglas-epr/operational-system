/**
 * Inline AI Configuration Modal.
 * Opens from the timeout toast "Go to Settings" action so the user can
 * update their AI provider/model without leaving the Sandbox Planner.
 * Wraps the shared AiSettingsForm component.
 */
"use client";

import type { UserAiSettingsClient } from "@/types/settings";
import type { SaveAiSettingsPayload } from "@/types/settings";
import AiSettingsForm from "@/components/features/AiSettingsForm";

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiSettings: UserAiSettingsClient;
  onSave: (payload: SaveAiSettingsPayload) => Promise<{ error?: string }>;
}

export default function AiConfigModal({
  isOpen,
  onClose,
  aiSettings,
  onSave,
}: AiConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 overflow-y-auto py-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-950 rounded-2xl shadow-2xl w-full max-w-xl mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">AI Configuration</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Update your AI provider, API key, and model selection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors focus-visible:outline-none ml-4 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div className="px-8 py-6">
          <AiSettingsForm
            initialSettings={aiSettings}
            onSave={onSave}
            onSuccess={onClose}
            submitLabel="Save & Close"
          />
        </div>
      </div>
    </div>
  );
}
