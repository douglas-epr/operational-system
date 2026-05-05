/**
 * Settings shell — orchestrates the four sections of the Settings page:
 *
 *   1. Agency information         (admin only)
 *   2. Agency AI Configuration    (admin/manager only)
 *   3. AI Configuration (yours)   (everyone)
 *
 * Each section renders only when the caller has the right role; otherwise
 * the user sees a smaller page with just their own AI form, exactly as
 * before this change.
 */
"use client";

import AiSettingsForm from "@/components/features/AiSettingsForm";
import AgencyForm from "./AgencyForm";
import AgencyAiSettingsForm from "./AgencyAiSettingsForm";
import AccountSecurityForm from "./AccountSecurityForm";
import ThemePicker from "./ThemePicker";
import type {
  Agency,
  AgencyAiSettingsSummary,
  UserAiSettingsClient,
} from "@/types/settings";
import type { ThemeChoice } from "@/components/theme/ThemeProvider";
import { saveAiSettings } from "../actions";

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
  settings: UserAiSettingsClient;
  role: string | null;
  isAdmin: boolean;
  isAdminOrManager: boolean;
  agency: Agency | null;
  agencyAiRow: AgencyAiRow | null;
  agencyAiSummary: AgencyAiSettingsSummary | null;
  userEmail: string;
  initialTheme?: ThemeChoice;
}

export default function SettingsShell({
  settings,
  role,
  isAdmin,
  isAdminOrManager,
  agency,
  agencyAiRow,
  agencyAiSummary,
  userEmail,
  initialTheme,
}: Props) {
  const isPersonalOnly = role === "referrer" || role === "lead";

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Account</h2>
          <p className="text-sm text-text-muted mt-1">
            Update the email address and password used to sign in.
          </p>
        </div>
        <AccountSecurityForm currentEmail={userEmail} />
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Theme</h2>
          <p className="text-sm text-text-muted mt-1">
            Choose how the app looks — Light or Dark.
          </p>
        </div>
        <ThemePicker initialTheme={initialTheme} />
      </section>

      {isAdmin && (
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-text-primary">Agency</h2>
            <p className="text-sm text-text-muted mt-1">
              The agency this Blur Studio install belongs to. Only admins can
              edit this.
            </p>
          </div>
          <AgencyForm initialAgency={agency} />
        </section>
      )}

      {isAdminOrManager && (
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-text-primary">
              Agency AI Configuration
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Shared API keys + models that any teammate or client can opt into
              from their own AI Configuration block below. Only admins and
              managers can edit these.
            </p>
          </div>
          <AgencyAiSettingsForm
            agencyExists={Boolean(agency)}
            initialRow={agencyAiRow}
          />
        </section>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            AI Configuration
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Your personal AI service, keys, and preferred models. Used when
            generating content in the Sandbox Planner, the chatbots, and the
            "Import tasks from idea" tool.
          </p>
          {isPersonalOnly && (
            <p className="mt-2 text-xs text-amber-300">
              Your role uses personal API keys only — agency keys are not
              available to {role}s.
            </p>
          )}
        </div>
        <AiSettingsForm
          initialSettings={settings}
          agencySummary={agencyAiSummary}
          allowAgencyToggle={!isPersonalOnly}
          onSave={saveAiSettings}
        />
      </section>
    </div>
  );
}
