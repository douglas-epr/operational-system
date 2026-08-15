"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UserAiSettingsClient, SaveAiSettingsPayload } from "@/types/settings";
import { OPENROUTER_MODELS } from "@/types/settings";

interface AiSettingsFormProps {
  /** Current settings. */
  initialSettings: UserAiSettingsClient;
  /** Server action to save settings. */
  onSave: (payload: SaveAiSettingsPayload) => Promise<{ error?: string }>;
  /** Called after a successful save. */
  onSuccess?: () => void;
  /** Label for the submit button. Defaults to "Save Settings". */
  submitLabel?: string;
}

export default function AiSettingsForm({
  initialSettings,
  onSave,
  onSuccess,
  submitLabel = "Save Settings",
}: AiSettingsFormProps) {
  const [model, setModel] = useState(initialSettings.model);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await onSave({ model });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    onSuccess?.();
  }

  const selectClass = cn(
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
    "disabled:opacity-50"
  );

  const isKnownModel = OPENROUTER_MODELS.some((m) => m.id === model);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-medium text-text-primary">Provider: OpenRouter</p>
        <p className="text-xs text-text-muted mt-1">
          AI is provided by the platform — no API key needed. Pick the model you want your
          generations to run on.
        </p>
      </div>

      <div>
        <label
          htmlFor="ai-model"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Model
        </label>
        <select
          id="ai-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={isSubmitting}
          className={selectClass}
        >
          {!isKnownModel && <option value={model}>{model}</option>}
          {OPENROUTER_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-sm text-green-400" role="status">
          Settings saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "bg-accent text-white hover:bg-accent/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
