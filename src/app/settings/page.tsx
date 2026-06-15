import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import SettingsShell from "./_components/SettingsShell";
import { getAgency } from "./actions";
import type { UserAiSettingsClient, AiService } from "@/types/settings";
import type { ThemeChoice } from "@/components/theme/ThemeProvider";

export default async function SettingsPage() {
  const { supabase, userId } = await requirePageAccess({
    denyRoles: ["referrer"],
  });

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const userEmail = authUser?.email ?? "";

  const [{ data: profile }, { data: settings }, agency] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, picture, type, theme")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_ai_settings" as never)
      .select(
        "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
      )
      .eq("owner_id" as never, userId)
      .maybeSingle(),
    getAgency(),
  ]);

  const settingsRow = settings as unknown as {
    active_service: string | null;
    openai_api_key: string | null;
    gemini_api_key: string | null;
    claude_api_key: string | null;
    openai_model: string | null;
    gemini_model: string | null;
    claude_model: string | null;
  } | null;

  const profileRow = profile as unknown as {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
    type: string | null;
    theme?: string | null;
  } | null;

  const role = profileRow?.type ?? null;
  const initialTheme: ThemeChoice = profileRow?.theme === "light" ? "light" : "dark";
  const isAdmin = role === "admin";

  const clientSettings: UserAiSettingsClient = {
    activeService: (settingsRow?.active_service as AiService) ?? null,
    openaiKeySet: !!settingsRow?.openai_api_key,
    geminiKeySet: !!settingsRow?.gemini_api_key,
    claudeKeySet: !!settingsRow?.claude_api_key,
    openaiModel: settingsRow?.openai_model ?? "gpt-4.1",
    geminiModel: settingsRow?.gemini_model ?? "gemini-2.5-flash",
    claudeModel: settingsRow?.claude_model ?? "claude-sonnet-4-20250514",
  };

  return (
    <PageShell profile={profileRow as import("@/types/projects").UserProfile | null} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader title="Settings" compact />
      </div>
      <div className="flex-1 px-6 py-8 max-w-2xl">
        <SettingsShell
          settings={clientSettings}
          isAdmin={isAdmin}
          agency={agency}
          userEmail={userEmail}
          initialTheme={initialTheme}
        />
      </div>
    </PageShell>
  );
}
