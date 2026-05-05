"use client";

/**
 * AgencyAiSettingsForm — admin/manager-only editor for the agency-wide
 * AI configuration. Reuses the generic `AiSettingsForm` (the same one
 * that drives the per-user editor) by feeding it the agency row, hiding
 * the "Use my agency's keys" toggle, and routing `onSave` to the
 * `saveAgencyAiSettings` server action.
 *
 * If the singleton agency row hasn't been created yet, we surface a
 * gentle banner asking the admin to fill in the Agency block first
 * (since `agency_ai_settings.agency_id` references the agency).
 */

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AiSettingsForm from "@/components/features/AiSettingsForm";
import type {
  AiService,
  SaveAgencyAiSettingsPayload,
  SaveAiSettingsPayload,
  UserAiSettingsClient,
} from "@/types/settings";
import { saveAgencyAiSettings } from "../actions";

interface AgencyAiRow {
  agency_id: string;
  active_service: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  claude_api_key: string | null;
  openai_model: string | null;
  gemini_model: string | null;
  claude_model: string | null;
}

interface Props {
  agencyExists: boolean;
  initialRow: AgencyAiRow | null;
}

export default function AgencyAiSettingsForm({ agencyExists, initialRow }: Props) {
  const router = useRouter();

  if (!agencyExists) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Set the <span className="font-medium">Agency information</span> above
        first — agency AI settings need an agency to attach to.
      </div>
    );
  }

  // The shared form expects a UserAiSettingsClient-shaped object. Build one
  // from the agency row, masking the keys to booleans (the shared form
  // already treats keys as opaque "key set / not set" indicators).
  const initialSettings: UserAiSettingsClient = {
    activeService: (initialRow?.active_service as AiService | null) ?? null,
    openaiKeySet: Boolean(initialRow?.openai_api_key),
    geminiKeySet: Boolean(initialRow?.gemini_api_key),
    claudeKeySet: Boolean(initialRow?.claude_api_key),
    openaiModel: initialRow?.openai_model ?? "gpt-4.1",
    geminiModel: initialRow?.gemini_model ?? "gemini-2.5-flash",
    claudeModel: initialRow?.claude_model ?? "claude-sonnet-4-20250514",
    // Toggle is hidden for this form, so the value is irrelevant — but
    // it has to be a boolean to satisfy the type. FALSE is the safer
    // value for the agency row itself (it never "uses agency").
    useAgencySettings: false,
  };

  async function onSave(payload: SaveAiSettingsPayload): Promise<{ error?: string }> {
    // Adapt the per-user payload shape to the agency action's payload.
    const adapted: SaveAgencyAiSettingsPayload = {
      activeService: payload.activeService,
      openaiApiKey: payload.openaiApiKey,
      geminiApiKey: payload.geminiApiKey,
      claudeApiKey: payload.claudeApiKey,
      openaiModel: payload.openaiModel,
      geminiModel: payload.geminiModel,
      claudeModel: payload.claudeModel,
    };
    const res = await saveAgencyAiSettings(adapted);
    if (!res.error) {
      toast.success("Agency AI settings saved");
      router.refresh();
    }
    return res;
  }

  return (
    <AiSettingsForm
      initialSettings={initialSettings}
      onSave={onSave}
      submitLabel="Save Agency AI Settings"
      allowAgencyToggle={false}
    />
  );
}
