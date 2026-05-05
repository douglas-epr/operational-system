import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import ProfileForm from "./_components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, country, signature")
    .eq("id", user.id)
    .single();

  return (
    <PageShell profile={profile} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader title="Profile" compact />
      </div>
      <div className="flex-1 px-6 py-8 max-w-lg">
        <ProfileForm
          profile={{
            first_name: profile?.first_name ?? "",
            last_name:  profile?.last_name  ?? "",
            picture:    profile?.picture    ?? "",
            country:    profile?.country    ?? "",
            email:      user.email          ?? "",
            signature:  profile?.signature  ?? null,
          }}
        />
      </div>
    </PageShell>
  );
}
