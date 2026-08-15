import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import SettingsShell from "./_components/SettingsShell";
import { getAgency } from "./actions";
import type { UserAiSettingsClient } from "@/types/settings";
import { DEFAULT_OPENROUTER_MODEL } from "@/types/settings";
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
      .select("openrouter_model")
      .eq("owner_id" as never, userId)
      .maybeSingle(),
    getAgency(),
  ]);

  const settingsRow = settings as unknown as {
    openrouter_model: string | null;
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
    model: settingsRow?.openrouter_model ?? DEFAULT_OPENROUTER_MODEL,
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
