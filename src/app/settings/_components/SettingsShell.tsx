"use client";

import AiSettingsForm from "@/components/features/AiSettingsForm";
import AgencyForm from "./AgencyForm";
import AccountSecurityForm from "./AccountSecurityForm";
import ThemePicker from "./ThemePicker";
import type { Agency, UserAiSettingsClient } from "@/types/settings";
import type { ThemeChoice } from "@/components/theme/ThemeProvider";
import { saveAiSettings } from "../actions";

interface Props {
  settings: UserAiSettingsClient;
  isAdmin: boolean;
  agency: Agency | null;
  userEmail: string;
  initialTheme?: ThemeChoice;
}

export default function SettingsShell({
  settings,
  isAdmin,
  agency,
  userEmail,
  initialTheme,
}: Props) {
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
              The agency this Move37 install belongs to. Only admins can edit this.
            </p>
          </div>
          <AgencyForm initialAgency={agency} />
        </section>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-text-primary">AI Configuration</h2>
          <p className="text-sm text-text-muted mt-1">
            Your personal AI service, keys, and preferred models. Used when generating
            content in the Sandbox Planner, the chatbots, and the "Import tasks from idea" tool.
          </p>
        </div>
        <AiSettingsForm
          initialSettings={settings}
          onSave={saveAiSettings}
        />
      </section>
    </div>
  );
}
