"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
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
}

export default function AiSettingsForm({
  initialSettings,
  onSave,
  onSuccess,
  submitLabel = "Save Settings",
}: AiSettingsFormProps) {
  const [activeService, setActiveService] = useState<AiService | "">(
    initialSettings.activeService ?? ""
  );
  const [openaiModel, setOpenaiModel] = useState(initialSettings.openaiModel);
  const [geminiModel, setGeminiModel] = useState(initialSettings.geminiModel);
  const [claudeModel, setClaudeModel] = useState(initialSettings.claudeModel);

  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");

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
    };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active Service */}
      <div>
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
        void keySet;
        const keyValue =
          service === "openai" ? openaiKey : service === "gemini" ? geminiKey : claudeKey;
        const setKeyValue =
          service === "openai" ? setOpenaiKey : service === "gemini" ? setGeminiKey : setClaudeKey;
        const modelValue =
          service === "openai" ? openaiModel : service === "gemini" ? geminiModel : claudeModel;
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
              isActive ? "border-accent/50 bg-accent/5" : "border-border opacity-60"
            )}
          >
            <legend className="px-2 text-sm font-semibold text-text-primary">
              {AI_SERVICE_LABELS[service]}
              {isActive && (
                <span className="ml-2 text-xs font-normal text-accent">Active</span>
              )}
            </legend>

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
