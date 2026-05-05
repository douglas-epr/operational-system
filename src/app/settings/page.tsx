/**
 * Settings page — server component.
 *
 * Loads (in parallel) the caller's profile + their `user_ai_settings` +
 * the singleton `agency` row + a sanitized agency-AI summary. Only admins
 * see the Agency editor; only admin/manager see the Agency-AI editor; the
 * "Use my agency's AI keys" toggle on the per-user form is hidden for
 * `referrer` and `lead` profiles.
 */
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import SettingsShell from "./_components/SettingsShell";
import { getAgency, getAgencyAiSettings, getAgencyAiSettingsSummary } from "./actions";
import type { UserAiSettingsClient, AiService } from "@/types/settings";
import type { ThemeChoice } from "@/components/theme/ThemeProvider";

export default async function SettingsPage() {
  // Gate: every authenticated user EXCEPT referrer. Referrers are sent
  // to /recommended-projects via the shared helper. Lead + every other
  // role can edit their own settings.
  const { supabase, userId } = await requirePageAccess({
    denyRoles: ["referrer"],
  });

  // Email lives on auth.users, not on profiles — fetch it from the auth
  // session so the AccountSecurityForm can show / update it.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const userEmail = authUser?.email ?? "";

  // Fetch profile + per-user settings + agency + agency-AI summary together.
  const [
    { data: profile },
    { data: settings },
    agency,
    agencyAiSummary,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, picture, type, theme")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_ai_settings" as never)
      .select(
        "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model, use_agency_settings"
      )
      .eq("owner_id" as never, userId)
      .maybeSingle(),
    getAgency(),
    getAgencyAiSettingsSummary(),
  ]);

  const settingsRow = settings as unknown as {
    active_service: string | null;
    openai_api_key: string | null;
    gemini_api_key: string | null;
    claude_api_key: string | null;
    openai_model: string | null;
    gemini_model: string | null;
    claude_model: string | null;
    use_agency_settings: boolean | null;
  } | null;

  const profileRow = profile as { type?: string | null; theme?: string | null } | null;
  const role = profileRow?.type ?? null;
  const initialTheme: ThemeChoice = (profileRow?.theme === "light" ? "light" : "dark");
  const isPersonalOnlyRole = role === "referrer" || role === "lead";
  const isAdmin = role === "admin";
  const isAdminOrManager = isAdmin || role === "manager";

  // For new users, default the toggle ON unless they're personal-only.
  const useAgencySettings = isPersonalOnlyRole
    ? false
    : settingsRow?.use_agency_settings ?? true;

  const clientSettings: UserAiSettingsClient = {
    activeService: (settingsRow?.active_service as AiService) ?? null,
    openaiKeySet: !!settingsRow?.openai_api_key,
    geminiKeySet: !!settingsRow?.gemini_api_key,
    claudeKeySet: !!settingsRow?.claude_api_key,
    openaiModel: settingsRow?.openai_model ?? "gpt-4.1",
    geminiModel: settingsRow?.gemini_model ?? "gemini-2.5-flash",
    claudeModel: settingsRow?.claude_model ?? "claude-sonnet-4-20250514",
    useAgencySettings,
  };

  // For admin/manager, also pre-fetch the full agency-AI row (keys
  // included) so the AgencyAiSettingsForm can hydrate. Non-elevated
  // users get null.
  const agencyAiRow = isAdminOrManager ? await getAgencyAiSettings() : null;

  return (
    <PageShell profile={profile} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader title="Settings" compact />
      </div>
      <div className="flex-1 px-6 py-8 max-w-2xl">
        <SettingsShell
          settings={clientSettings}
          role={role}
          isAdmin={isAdmin}
          isAdminOrManager={isAdminOrManager}
          agency={agency}
          agencyAiRow={agencyAiRow}
          agencyAiSummary={agencyAiSummary}
          userEmail={userEmail}
          initialTheme={initialTheme}
        />
      </div>
    </PageShell>
  );
}
