"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { Project, UserProfile, UserType } from "@/types/projects";
import type {
  AgreementTemplate,
  AgreementVersion,
  DocsTabKey,
  PlaybookComment,
  PlaybookCommentReply,
  PlaybookVersion,
  ProjectDailyFeedback,
  ProjectFile,
  ProjectInvoice,
  ProjectLink,
  ProjectVideo,
} from "@/types/docs";
import { DOCS_TAB_LABELS, DOCS_TAB_ORDER } from "@/types/docs";
import PlaybookTab from "./PlaybookTab";
import AgreementsTab from "./AgreementsTab";
import FilesTab from "./FilesTab";
import LinksTab from "./LinksTab";
import VideosTab from "./VideosTab";
import DailyFeedbackTab from "./DailyFeedbackTab";
import InvoicesTab from "./InvoicesTab";

interface Props {
  projects: Project[];
  profiles: UserProfile[];
  currentUserId: string;
  currentUserType: UserType | null;
  currentUserProfile: UserProfile | null;
  activeProject: Project | null;
  activeTab: DocsTabKey;
  playbookVersions: PlaybookVersion[];
  playbookComments: PlaybookComment[];
  playbookReplies: PlaybookCommentReply[];
  agreements: AgreementVersion[];
  templates: AgreementTemplate[];
  files: ProjectFile[];
  links: ProjectLink[];
  videos: ProjectVideo[];
  dailyFeedbacks: ProjectDailyFeedback[];
  invoices: ProjectInvoice[];
  linkedIdeaId: string | null;
}

export default function DocsShell({
  projects,
  profiles,
  currentUserId,
  currentUserType,
  currentUserProfile,
  activeProject,
  activeTab,
  playbookVersions,
  playbookComments,
  playbookReplies,
  agreements,
  templates,
  files,
  links,
  videos,
  dailyFeedbacks,
  invoices,
  linkedIdeaId,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [projects, search]);

  const isAdminOrManager =
    currentUserType === "admin" || currentUserType === "manager";

  return (
    <div className="flex flex-1 min-h-0">
      {/* ── Left column: project list ────────────────────────────── */}
      <aside className="w-[280px] shrink-0 border-r border-border flex flex-col bg-surface">
        <div className="px-4 pt-5 pb-3 border-b border-border shrink-0">
          <h1 className="text-heading-3 text-text-primary mb-3">Docs</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <p className="px-4 py-6 text-xs text-text-muted">No projects.</p>
          ) : (
            <ul>
              {filteredProjects.map((p) => {
                const isActive = activeProject?.id === p.id;
                return (
                  <li key={p.id}>
                    <Link
                      href={{
                        pathname: "/docs",
                        query: { project: p.id, tab: activeTab },
                      }}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors border-l-2 ${
                        isActive
                          ? "bg-muted text-text-primary border-accent"
                          : "text-text-secondary border-transparent hover:bg-muted/50 hover:text-text-primary"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-text-muted">
                        {p.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.picture} alt={p.name ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          (p.name ?? "?").slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="truncate">{p.name ?? "Untitled"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Right column: tabs + content ─────────────────────────── */}
      <section className="flex-1 min-w-0 flex flex-col">
        {!activeProject ? (
          <div className="flex-1 flex items-center justify-center p-10 text-text-muted text-sm">
            Select a project on the left to view its docs.
          </div>
        ) : (
          <>
            {/* ── Project header + tab strip ─────────────────────── */}
            <div className="border-b border-border shrink-0 bg-surface">
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="w-8 h-8 rounded-md bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-text-muted shrink-0">
                  {activeProject.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeProject.picture} alt={activeProject.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    (activeProject.name ?? "?").slice(0, 1).toUpperCase()
                  )}
                </div>
                <h2 className="text-base font-semibold text-text-primary truncate">
                  {activeProject.name ?? "Untitled project"}
                </h2>
              </div>

              <nav className="flex items-center gap-1 px-4 overflow-x-auto">
                {DOCS_TAB_ORDER.map((t) => {
                  const isActive = t === activeTab;
                  return (
                    <Link
                      key={t}
                      href={{
                        pathname: "/docs",
                        query: { project: activeProject.id, tab: t },
                      }}
                      className={`shrink-0 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                        isActive
                          ? "border-accent text-text-primary"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {DOCS_TAB_LABELS[t]}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ── Active tab body ───────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "playbook" && (
                <PlaybookTab
                  project={activeProject}
                  profiles={profiles}
                  versions={playbookVersions}
                  comments={playbookComments}
                  replies={playbookReplies}
                  currentUserId={currentUserId}
                  isAdminOrManager={isAdminOrManager}
                  linkedIdeaId={linkedIdeaId}
                />
              )}

              {activeTab === "agreements" && (
                <AgreementsTab
                  project={activeProject}
                  profiles={profiles}
                  agreements={agreements}
                  templates={templates}
                  currentUserId={currentUserId}
                  currentUserProfile={currentUserProfile}
                  isAdminOrManager={isAdminOrManager}
                />
              )}

              {activeTab === "files" && (
                <FilesTab
                  project={activeProject}
                  profiles={profiles}
                  files={files}
                  currentUserId={currentUserId}
                  isAdminOrManager={isAdminOrManager}
                />
              )}

              {activeTab === "links" && (
                <LinksTab
                  project={activeProject}
                  profiles={profiles}
                  links={links}
                  currentUserId={currentUserId}
                  isAdminOrManager={isAdminOrManager}
                />
              )}

              {activeTab === "videos" && (
                <VideosTab
                  project={activeProject}
                  profiles={profiles}
                  videos={videos}
                  currentUserId={currentUserId}
                  isAdminOrManager={isAdminOrManager}
                />
              )}

              {activeTab === "daily_feedback" && (
                <DailyFeedbackTab
                  project={activeProject}
                  profiles={profiles}
                  feedbacks={dailyFeedbacks}
                  currentUserId={currentUserId}
                  isAdminOrManager={isAdminOrManager}
                />
              )}

              {activeTab === "invoices" && (
                <InvoicesTab
                  project={activeProject}
                  profiles={profiles}
                  invoices={invoices}
                  currentUserId={currentUserId}
                  isAdminOrManager={isAdminOrManager}
                />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

