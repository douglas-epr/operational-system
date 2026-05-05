"use client";

/**
 * ProjectTabsPanel — renders the same Files / Links / Videos / Daily
 * Feedback UIs that /docs ships, wired into the /chat layout.
 *
 * Approach:
 *   - Fetch the active project + visible profiles + the selected-tab data
 *     via the chat server actions (RLS-clamped just like /docs).
 *   - Render the corresponding /docs/_components/*Tab.tsx component.
 *   - Poll every 2s while mounted so writes inside those tabs (which call
 *     router.refresh() under the hood — that won't re-run our client-side
 *     useEffect) become visible to the user without a manual reload.
 *
 * Only Projects + Projects Internal blocks reach this panel; the chat
 * UI hides these tabs on the other blocks.
 */

import { useEffect, useState } from "react";
import type { Project, UserProfile } from "@/types/projects";
import type {
  ProjectDailyFeedback,
  ProjectFile,
  ProjectLink,
  ProjectVideo,
} from "@/types/docs";
import type { ChatTab } from "@/types/chat";
import {
  getProjectDailyFeedbacks,
  getProjectFiles,
  getProjectForTabs,
  getProjectLinks,
  getProjectVideos,
} from "../actions";
import FilesTab from "../../docs/_components/FilesTab";
import LinksTab from "../../docs/_components/LinksTab";
import VideosTab from "../../docs/_components/VideosTab";
import DailyFeedbackTab from "../../docs/_components/DailyFeedbackTab";

interface Props {
  projectId: string;
  tab: Exclude<ChatTab, "messages">;
}

interface State {
  project: Project | null;
  profiles: UserProfile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  files: ProjectFile[];
  links: ProjectLink[];
  videos: ProjectVideo[];
  dailyFeedbacks: ProjectDailyFeedback[];
}

const POLL_MS = 2000;

export default function ProjectTabsPanel({ projectId, tab }: Props) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [meta, files, links, videos, daily] = await Promise.all([
        getProjectForTabs(projectId),
        getProjectFiles(projectId),
        getProjectLinks(projectId),
        getProjectVideos(projectId),
        getProjectDailyFeedbacks(projectId),
      ]);
      if (cancelled) return;
      setState({
        project: (meta.project ?? null) as Project | null,
        profiles: (meta.profiles ?? []) as unknown as UserProfile[],
        currentUserId: meta.currentUserId,
        isAdminOrManager: meta.isAdminOrManager,
        files,
        links,
        videos,
        dailyFeedbacks: daily,
      });
    }

    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [projectId]);

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }
  if (!state.project) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Project not found.
      </div>
    );
  }

  if (tab === "files") {
    return (
      <FilesTab
        project={state.project}
        profiles={state.profiles}
        files={state.files}
        currentUserId={state.currentUserId}
        isAdminOrManager={state.isAdminOrManager}
      />
    );
  }
  if (tab === "links") {
    return (
      <LinksTab
        project={state.project}
        profiles={state.profiles}
        links={state.links}
        currentUserId={state.currentUserId}
        isAdminOrManager={state.isAdminOrManager}
      />
    );
  }
  if (tab === "videos") {
    return (
      <VideosTab
        project={state.project}
        profiles={state.profiles}
        videos={state.videos}
        currentUserId={state.currentUserId}
        isAdminOrManager={state.isAdminOrManager}
      />
    );
  }
  // daily_feedback
  return (
    <DailyFeedbackTab
      project={state.project}
      profiles={state.profiles}
      feedbacks={state.dailyFeedbacks}
      currentUserId={state.currentUserId}
      isAdminOrManager={state.isAdminOrManager}
    />
  );
}
