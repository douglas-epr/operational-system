/**
 * Reusable AI settings form.
 * Used by both the Settings page and the AI settings popup modal.
 * Manages API keys, active service, and model selection.
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AgencyAiSettingsSummary,
  AiService,
  UserAiSettingsClient,
  SaveAiSettingsPayload,
} from "@/types/settings";
import {
  AI_SERVICE_LABELS,
  AI_SERVICE_VALUES,
  DEFAULT_MODELS,
} from "@/types/settings";

interface AiSettingsFormProps {
  /** Current settings (keys masked to booleans). */
  initialSettings: UserAiSettingsClient;
  /** Server action to save settings. */
  onSave: (payload: SaveAiSettingsPayload) => Promise<{ error?: string }>;
  /** Called after a successful save. */
  onSuccess?: () => void;
  /** Label for the submit button. Defaults to "Save Settings". */
  submitLabel?: string;
  /**
   * Agency-AI summary (no raw keys) used to render a read-only preview
   * when the user has the "Use my agency's AI keys" toggle ON.
   *
   * Pass `null` if the agency has no AI config yet, or `undefined` when
   * the form is being used in a context where the toggle shouldn't appear
   * at all (e.g. the dedicated Agency-AI editor reuses this same form
   * with `allowAgencyToggle={false}`).
   */
  agencySummary?: AgencyAiSettingsSummary | null;
  /**
   * When false the toggle is hidden entirely. Default true. The
   * `referrer` / `lead` Settings flow + the Agency-AI editor both pass
   * false to suppress the toggle.
   */
  allowAgencyToggle?: boolean;
}

/** Form for configuring AI service, API keys, and model selection. */
export default function AiSettingsForm({
  initialSettings,
  onSave,
  onSuccess,
  submitLabel = "Save Settings",
  agencySummary,
  allowAgencyToggle = true,
}: AiSettingsFormProps) {
  const [activeService, setActiveService] = useState<AiService | "">(
    initialSettings.activeService ?? ""
  );
  const [openaiModel, setOpenaiModel] = useState(initialSettings.openaiModel);
  const [geminiModel, setGeminiModel] = useState(initialSettings.geminiModel);
  const [claudeModel, setClaudeModel] = useState(initialSettings.claudeModel);

  // Key fields — empty means "keep current"; non-empty replaces the stored key
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");

  // The "Use my agency's AI keys" toggle. When ON, the per-service form is
  // collapsed into a read-only preview built from `agencySummary` and the
  // user's personal fields are still saved (so flipping back OFF restores
  // their previous personal config).
  const [useAgency, setUseAgency] = useState<boolean>(
    initialSettings.useAgencySettings
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const payload: SaveAiSettingsPayload = {
      activeService: activeService || null,
      openaiModel,
      geminiModel,
      claudeModel,
      useAgencySettings: allowAgencyToggle ? useAgency : undefined,
    };

    // Only send key fields if the user actually typed something
    if (openaiKey.trim()) payload.openaiApiKey = openaiKey.trim();
    if (geminiKey.trim()) payload.geminiApiKey = geminiKey.trim();
    if (claudeKey.trim()) payload.claudeApiKey = claudeKey.trim();

    const result = await onSave(payload);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    onSuccess?.();
  }

  const inputClass = cn(
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
    "disabled:opacity-50"
  );

  const selectClass = cn(
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
    "disabled:opacity-50"
  );

  // When the agency toggle is ON, the per-service editor is hidden and the
  // form renders a compact summary of the agency configuration instead.
  // The user's personal fields are still kept in state — flipping the
  // toggle OFF reveals them again unmodified.
  const showAgencyPreview = allowAgencyToggle && useAgency;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Use-agency toggle (hidden for personal-only roles + the Agency-AI
          editor that wraps this same form) */}
      {allowAgencyToggle && (
        <label className="flex items-start gap-3 rounded-lg border border-border bg-elevated p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useAgency}
            onChange={(e) => setUseAgency(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
          />
          <span className="text-sm">
            <span className="font-medium text-text-primary">
              Use my agency&apos;s AI keys
            </span>
            <span className="block text-xs text-text-muted mt-0.5">
              When enabled, your AI calls run on the agency&apos;s shared API key
              and model. Disable to use your personal keys below.
            </span>
          </span>
        </label>
      )}

      {showAgencyPreview && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 space-y-1 text-sm">
          {agencySummary?.active_service ? (
            <>
              <div className="text-text-primary font-medium">
                Using agency configuration
              </div>
              <div className="text-text-muted">
                Provider: {AI_SERVICE_LABELS[agencySummary.active_service]}
                {" · "}
                Model:{" "}
                {agencySummary.active_service === "openai"
                  ? agencySummary.openai_model
                  : agencySummary.active_service === "gemini"
                    ? agencySummary.gemini_model
                    : agencySummary.claude_model}
              </div>
              <div className="text-xs text-text-muted">
                Key configured:{" "}
                {agencySummary.active_service === "openai"
                  ? agencySummary.has_openai_key ? "Yes" : "No"
                  : agencySummary.active_service === "gemini"
                    ? agencySummary.has_gemini_key ? "Yes" : "No"
                    : agencySummary.has_claude_key ? "Yes" : "No"}
              </div>
            </>
          ) : (
            <div className="text-text-muted">
              The agency hasn&apos;t configured AI yet. Ask an admin or manager
              to fill in <span className="text-text-primary">Agency AI
              Configuration</span> above, or disable this toggle to use your
              own keys.
            </div>
          )}
        </div>
      )}

      {/* Active Service */}
      <div className={cn(showAgencyPreview && "hidden")}>
        <label
          htmlFor="ai-active-service"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Active AI Service
        </label>
        <select
          id="ai-active-service"
          value={activeService}
          onChange={(e) => setActiveService(e.target.value as AiService | "")}
          disabled={isSubmitting}
          className={selectClass}
        >
          <option value="">None (disabled)</option>
          {AI_SERVICE_VALUES.map((s) => (
            <option key={s} value={s}>
              {AI_SERVICE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Per-service config sections */}
      {AI_SERVICE_VALUES.map((service) => {
        const keySet =
          service === "openai"
            ? initialSettings.openaiKeySet
            : service === "gemini"
              ? initialSettings.geminiKeySet
              : initialSettings.claudeKeySet;
        void keySet; // key presence shown via placeholder; no longer used for conditional rendering
        const keyValue =
          service === "openai"
            ? openaiKey
            : service === "gemini"
              ? geminiKey
              : claudeKey;
        const setKeyValue =
          service === "openai"
            ? setOpenaiKey
            : service === "gemini"
              ? setGeminiKey
              : setClaudeKey;
        const modelValue =
          service === "openai"
            ? openaiModel
            : service === "gemini"
              ? geminiModel
              : claudeModel;
        const setModelValue =
          service === "openai"
            ? setOpenaiModel
            : service === "gemini"
              ? setGeminiModel
              : setClaudeModel;
        const isActive = activeService === service;

        return (
          <fieldset
            key={service}
            className={cn(
              "rounded-lg border p-4 space-y-4 transition-opacity",
              isActive
                ? "border-accent/50 bg-accent/5"
                : "border-border opacity-60",
              showAgencyPreview && "hidden"
            )}
          >
            <legend className="px-2 text-sm font-semibold text-text-primary">
              {AI_SERVICE_LABELS[service]}
              {isActive && (
                <span className="ml-2 text-xs font-normal text-accent">
                  Active
                </span>
              )}
            </legend>

            {/* API Key */}
            <div>
              <label
                htmlFor={`ai-key-${service}`}
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                API Key
              </label>
              <input
                id={`ai-key-${service}`}
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={
                  keySet
                    ? "Leave blank to keep current key"
                    : `Enter ${AI_SERVICE_LABELS[service]} API key...`
                }
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            {/* Model */}
            <div>
              <label
                htmlFor={`ai-model-${service}`}
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Model
              </label>
              <select
                id={`ai-model-${service}`}
                value={modelValue}
                onChange={(e) => setModelValue(e.target.value)}
                disabled={isSubmitting}
                className={selectClass}
              >
                {/* If saved model isn't in the list, show it as a selectable option */}
                {modelValue && !DEFAULT_MODELS[service].includes(modelValue) && (
                  <option value={modelValue}>{modelValue}</option>
                )}
                {DEFAULT_MODELS[service].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </fieldset>
        );
      })}

      {/* Error / Success messages */}
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

      {/* Submit */}
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
