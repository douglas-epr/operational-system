import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type {
  UserProfile,
  UserType,
  Project,
} from "@/types/projects";
import type {
  AgreementTemplate,
  AgreementVersion,
  DocsAttachment,
  DocsTabKey,
  OsAgreementStatus,
  PlaybookComment,
  PlaybookCommentReply,
  PlaybookVersion,
  ProjectDailyFeedback,
  ProjectFile,
  ProjectInvoice,
  ProjectLink,
  ProjectVideo,
} from "@/types/docs";
import { DOCS_TAB_ORDER } from "@/types/docs";
import DocsShell from "./_components/DocsShell";

interface PageProps {
  searchParams: Promise<{ project?: string; tab?: string }>;
}

export default async function DocsPage({ searchParams }: PageProps) {
  // Gate: admin/manager/operational/developer/qa/client. referrer + lead
  // are redirected via the shared helper.
  const { supabase, userId, role } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
    "developer",
    "qa",
    "client",
  ]);

  // Current user profile (kept for the Sidebar + signature lookups).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const userType = role as UserType;
  const isAdminOrManager = userType === "admin" || userType === "manager";

  // All profiles (for assignee pickers + name rendering)
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature");
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  // Projects the user is allowed to see
  let projectsQuery = supabase
    .from("project")
    .select(
      "id, name, picture, status, stage, program, description, price, referrer_commission, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, talent_who_recommended_id, company_that_recommended_id, created_at"
    )
    .order("created_at", { ascending: false });
  if (!isAdminOrManager) {
    projectsQuery = projectsQuery.contains("authorized_users", [userId]);
  }
  const { data: projectsData } = await projectsQuery;
  const projects = (projectsData ?? []) as unknown as Project[];

  const params = await searchParams;
  const rawProjectId = params.project;
  const rawTab       = params.tab;
  const activeTab: DocsTabKey = DOCS_TAB_ORDER.includes(rawTab as DocsTabKey)
    ? (rawTab as DocsTabKey)
    : "playbook";

  // Validate the requested project against the visible list.
  const activeProject =
    rawProjectId && projects.find((p) => p.id === rawProjectId)
      ? (projects.find((p) => p.id === rawProjectId) as Project)
      : null;

  let playbookVersions: PlaybookVersion[] = [];
  let playbookComments: PlaybookComment[] = [];
  let playbookReplies:  PlaybookCommentReply[] = [];
  let agreements:       AgreementVersion[] = [];
  let templates:        AgreementTemplate[] = [];
  let files:            ProjectFile[] = [];
  let links:            ProjectLink[] = [];
  let videos:           ProjectVideo[] = [];
  let dailyFeedbacks:   ProjectDailyFeedback[] = [];
  let invoices:         ProjectInvoice[] = [];
  let linkedIdeaId:     string | null = null;

  if (activeProject) {
    const [
      { data: pv },
      { data: pc },
      { data: pr },
      { data: av },
      { data: at },
      { data: pf },
      { data: pl },
      { data: pvid },
      { data: pdf },
      { data: pi },
    ] = await Promise.all([
      supabase
        .from("project_playbook_version")
        .select("id, project_id, version_name, content, google_docs_url, created_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_playbook_comment")
        .select("id, project_id, playbook_id, message, attachments, status, created_by, viewed_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("project_playbook_comment_reply")
        .select("id, project_id, playbook_id, project_playbook_comment_id, message, attachments, created_by, viewed_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("project_agreement_version")
        .select("id, project_id, name, type, content, google_docs_url, status, authorized_users, required_signers, signed_by, created_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("agreement_template")
        .select("id, name, content, created_by, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("project_file")
        .select("id, project_id, name, attachments, created_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_link")
        .select("id, project_id, name, url, created_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_video")
        .select("id, project_id, name, url, created_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_daily_feedback")
        .select("id, project_id, date, today_work, tomorrow_work, blockers, video_and_links, created_by, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("date", { ascending: false }),
      supabase
        .from("project_invoice")
        .select("id, project_id, created_by, authorized_users, code, company_or_user_name, document_number, address, phone, email, client_name, service_price, due_date, service_title, service_description, swift_code, iban_code, created_at, updated_at")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false }),
    ]);

    const ideaRes = await supabase
      .from("idea")
      .select("id")
      .eq("project_id", activeProject.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    playbookVersions = ((pv ?? []) as unknown as PlaybookVersion[]);
    playbookComments = ((pc ?? []) as unknown as (Omit<PlaybookComment, "attachments" | "status"> & { attachments: unknown; status: unknown })[])
      .map((c) => ({
        ...c,
        attachments: Array.isArray(c.attachments) ? (c.attachments as DocsAttachment[]) : [],
        status: (c.status === "solved" ? "solved" : "pending") as PlaybookComment["status"],
      }));
    playbookReplies = ((pr ?? []) as unknown as (Omit<PlaybookCommentReply, "attachments"> & { attachments: unknown })[])
      .map((r) => ({ ...r, attachments: Array.isArray(r.attachments) ? (r.attachments as DocsAttachment[]) : [] }));
    agreements = ((av ?? []) as unknown as AgreementVersion[]).map((a) => ({
      ...a,
      status: (a.status ?? "not_available") as OsAgreementStatus,
    }));
    templates = (at ?? []) as unknown as AgreementTemplate[];
    files = ((pf ?? []) as unknown as (Omit<ProjectFile, "attachments"> & { attachments: unknown })[])
      .map((f) => ({ ...f, attachments: Array.isArray(f.attachments) ? (f.attachments as DocsAttachment[]) : [] }));
    links          = (pl   ?? []) as unknown as ProjectLink[];
    videos         = (pvid ?? []) as unknown as ProjectVideo[];
    dailyFeedbacks = (pdf  ?? []) as unknown as ProjectDailyFeedback[];
    invoices       = ((pi ?? []) as unknown as (Omit<ProjectInvoice, "service_price"> & { service_price: number | string | null })[])
      .map((row) => ({
        ...row,
        service_price:
          row.service_price === null || row.service_price === undefined
            ? null
            : typeof row.service_price === "string"
              ? Number(row.service_price)
              : row.service_price,
      }));
    linkedIdeaId   = ((ideaRes?.data as { id?: string } | null)?.id) ?? null;
  }

  return (
    <PageShell profile={profile as UserProfile | null} fullBleed flush>
      <DocsShell
          projects={projects}
          profiles={profiles}
          currentUserId={userId}
          currentUserType={userType}
          currentUserProfile={(profile ?? null) as UserProfile | null}
          activeProject={activeProject}
          activeTab={activeTab}
          playbookVersions={playbookVersions}
          playbookComments={playbookComments}
          playbookReplies={playbookReplies}
          agreements={agreements}
          templates={templates}
          files={files}
          links={links}
          videos={videos}
          dailyFeedbacks={dailyFeedbacks}
          invoices={invoices}
          linkedIdeaId={linkedIdeaId}
        />
    </PageShell>
  );
}
