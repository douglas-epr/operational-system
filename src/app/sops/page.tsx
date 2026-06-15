import { requirePageAccess } from "@/lib/auth/page-gate";
import type { SopWithTags, SopTag, SopVersion } from "@/types/sops";
import type { UserProfile } from "@/types/projects";
import PageShell from "@/components/layout/PageShell";
import SopList from "./_components/SopList";
import SopEditor from "./_components/SopEditor";
import { DocumentIcon } from "@/components/ui/icons";

interface Props {
  searchParams: Promise<{ sop?: string }>;
}

export default async function SopsPage({ searchParams }: Props) {
  // Gate: admin/manager/operational/developer/qa/client. referrer + lead are
  // bounced via the shared helper.
  const { supabase, userId, role } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
    "developer",
    "qa",
    "client",
  ]);
  const isAdminOrManager = role === "admin" || role === "manager";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  // Admin/manager can edit SOPs; everyone else can view (RLS enforces).

  // Fetch all SOPs (tags are now a UUID[] column on `sop` directly,
  // not a join table — Part 2 item 43+45).
  const { data: sopsRaw } = await supabase
    .from("sop")
    .select("id, name, order, authorized_users, created_at, created_by, tags")
    .order("order", { ascending: true });

  // Fetch all tags first so we can hydrate the array of UUIDs into
  // {id, name} pairs the existing UI expects.
  const { data: allTagsRaw } = await supabase
    .from("sop_tag")
    .select("id, name")
    .order("name", { ascending: true });
  const allTags: SopTag[] = (allTagsRaw ?? []) as SopTag[];
  const tagById = new Map(allTags.map((t) => [t.id, t]));

  const sops: SopWithTags[] = (sopsRaw ?? []).map((s: any) => ({
    id:               s.id,
    name:             s.name,
    order:            s.order,
    authorized_users: s.authorized_users ?? [],
    created_at:       s.created_at,
    created_by:       s.created_by ?? null,
    tags:             ((s.tags ?? []) as string[])
      .map((id) => tagById.get(id))
      .filter(Boolean) as SopTag[],
  }));

  // Fetch all profiles (for SopModal authorized users)
  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .order("first_name", { ascending: true });
  const profiles: UserProfile[] = (profilesRaw ?? []) as UserProfile[];

  // Resolve active SOP from query param
  const { sop: activeSopId } = await searchParams;
  const activeSop = activeSopId ? sops.find((s) => s.id === activeSopId) ?? null : null;

  // Fetch versions for active SOP
  let versions: SopVersion[] = [];
  if (activeSop) {
    const { data: versionsRaw } = await supabase
      .from("sop_version")
      .select("id, sop_id, version_name, content, created_at, created_by")
      .eq("sop_id", activeSop.id)
      .order("created_at", { ascending: false });
    versions = (versionsRaw ?? []) as SopVersion[];
  }

  return (
    <PageShell profile={profile} fullBleed flush>
      {/* 2-column layout (list + editor) */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Documents panel */}
        <div className="w-[260px] shrink-0 flex flex-col overflow-hidden">
          <SopList
            sops={sops}
            allTags={allTags}
            profiles={profiles}
            activeSopId={activeSopId ?? null}
            currentUserId={userId}
            isAdminOrManager={isAdminOrManager}
          />
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeSop ? (
            /* key forces a full remount when the selected SOP changes,
               so useState in SopEditor always starts fresh */
            <SopEditor
              key={activeSop.id}
              sop={activeSop}
              versions={versions}
              currentUserId={userId}
              isAdminOrManager={isAdminOrManager}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              <div className="text-center">
                <DocumentIcon className="mx-auto mb-3 opacity-30 w-12 h-12" strokeWidth={1.5} />
                <p>Select a document to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
