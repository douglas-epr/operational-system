"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Project, Task, UserType, TabKey, UserProfile } from "@/types/projects";
import { getVisibleTabs, TAB_LABELS, getScheduleProgressBadge } from "@/types/projects";
import StagesChecking from "./tabs/StagesChecking";
import DeveloperTasks from "./tabs/DeveloperTasks";
import TasksKanban from "./tabs/TasksKanban";
import WorkingHoursModal from "./modals/WorkingHoursModal";
import QATimeTrackerModal from "./modals/QATimeTrackerModal";
import ProjectModal from "./modals/ProjectModal";

interface ProjectDetailProps {
  project: Project;
  tasks: Task[];
  userType: UserType | null;
  initialTab: TabKey;
  profiles: UserProfile[];
  currentUserId: string;
  unreadByTaskId: Record<string, number>;
}

const PROGRESS_COLORS: Record<"green" | "yellow" | "red", string> = {
  green:  "bg-[#14532d] text-[#86efac]",
  yellow: "bg-[#422006] text-[#fde68a]",
  red:    "bg-[#7f1d1d] text-[#fca5a5]",
};

export default function ProjectDetail({ project, tasks, userType, initialTab, profiles, currentUserId, unreadByTaskId }: ProjectDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visibleTabs = getVisibleTabs(userType);
  const defaultTab = visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0];
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [qaTrackerOpen, setQaTrackerOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/projects?${params.toString()}`, { scroll: false });
  }

  const totalEst = tasks.reduce((sum, t) => sum + (t.estimated_time ?? 0), 0);
  const doneOrQaEst = tasks
    .filter((t) => t.status === "done" || t.status === "ready_for_qa")
    .reduce((sum, t) => sum + (t.estimated_time ?? 0), 0);
  const progress = getScheduleProgressBadge(project, { totalEst, doneOrQaEst });
  const milestones = tasks.filter((t) => t.type === "developer_tasks" && t.level === "level_1" && !t.parent_task_id);

  // Tab status badge counts (blue — shows actionable items count)
  const clientNotStarted = tasks.filter((t) => t.type === "client_requests" && t.status === "not_started").length;
  const qaNotStarted = tasks.filter((t) => t.type === "qa_requests" && t.status === "not_started").length;
  const qaReadyForQa = tasks.filter((t) => t.type === "qa_requests" && t.status === "ready_for_qa").length;

  // Unread comment counts per tab (red — shows unread messages)
  const clientUnread = tasks
    .filter((t) => t.type === "client_requests")
    .reduce((s, t) => s + (unreadByTaskId[t.id] ?? 0), 0);
  const qaUnread = tasks
    .filter((t) => t.type === "qa_requests")
    .reduce((s, t) => s + (unreadByTaskId[t.id] ?? 0), 0);
  const developerUnread = tasks
    .filter((t) => t.type === "developer_tasks")
    .reduce((s, t) => s + (unreadByTaskId[t.id] ?? 0), 0);

  function getTabBadge(tab: TabKey): number {
    if (tab === "client_requests" && (userType === "admin" || userType === "manager" || userType === "developer")) {
      return clientNotStarted;
    }
    if (tab === "qa_requests") {
      if (userType === "qa") return qaReadyForQa;
      if (userType === "admin" || userType === "manager" || userType === "developer") return qaNotStarted;
    }
    return 0;
  }

  function getTabUnread(tab: TabKey): number {
    if (tab === "client_requests") return clientUnread;
    if (tab === "qa_requests")     return qaUnread;
    if (tab === "developer")       return developerUnread;
    return 0;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-text-muted">
            <Link href="/projects" className="hover:text-text-secondary transition-colors">
              Projects
            </Link>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="text-text-primary font-medium truncate max-w-[240px] hover:text-accent transition-colors"
            >
              {project.name ?? "Untitled"}
            </button>
          </nav>

          {/* Progress badge */}
          <span className={`status-badge text-[10px] ${PROGRESS_COLORS[progress.color]}`}>
            {progress.label}
          </span>
        </div>

        {/* Working hours button */}
        <button
          onClick={() => setWorkingHoursOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          See Working Hours
        </button>
      </div>

      {/* Tab bar — badges sit inline beside the label for a tight, balanced read.
          Blue = open / actionable count · Red = unread comments. */}
      <div className="flex items-end gap-0 px-6 border-b border-border">
        {visibleTabs.map((tab) => {
          const badge = getTabBadge(tab);
          const tabUnread = getTabUnread(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-accent text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              }`}
            >
              <span className="leading-none">{TAB_LABELS[tab]}</span>
              {(badge > 0 || tabUnread > 0) && (
                <span className="flex items-center gap-1">
                  {badge > 0 && (
                    <span
                      title={`${badge} open`}
                      className="min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full bg-info text-white text-[10px] font-semibold leading-none px-1.5 tabular-nums"
                    >
                      {badge}
                    </span>
                  )}
                  {tabUnread > 0 && (
                    <span
                      title={`${tabUnread} unread`}
                      className="min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-semibold leading-none px-1.5 tabular-nums"
                    >
                      {tabUnread}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "stages" && (
          <StagesChecking
            tasks={tasks}
            projectStage={project.stage}
          />
        )}
        {activeTab === "developer" && (
          <DeveloperTasks
            tasks={tasks}
            userType={userType}
            project={project}
            profiles={profiles}
            currentUserId={currentUserId}
            unreadByTaskId={unreadByTaskId}
          />
        )}
        {activeTab === "client_requests" && (
          <TasksKanban
            tasks={tasks}
            userType={userType}
            projectId={project.id}
            type="client_requests"
            profiles={profiles}
            currentUserId={currentUserId}
            milestones={milestones}
            authorizedUserIds={project.authorized_users}
            unreadByTaskId={unreadByTaskId}
          />
        )}
        {activeTab === "qa_requests" && (
          <TasksKanban
            tasks={tasks}
            userType={userType}
            projectId={project.id}
            type="qa_requests"
            profiles={profiles}
            currentUserId={currentUserId}
            onTrackQATime={() => setQaTrackerOpen(true)}
            milestones={milestones}
            authorizedUserIds={project.authorized_users}
            unreadByTaskId={unreadByTaskId}
          />
        )}
      </div>

      {/* Modals */}
      <WorkingHoursModal
        open={workingHoursOpen}
        onClose={() => setWorkingHoursOpen(false)}
        projectId={project.id}
        projectName={project.name ?? "Untitled"}
      />
      <QATimeTrackerModal
        open={qaTrackerOpen}
        onClose={() => setQaTrackerOpen(false)}
        projectId={project.id}
        milestones={milestones}
      />
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        project={project}
        profiles={profiles}
        taskProgress={null}
        userType={userType}
      />
    </div>
  );
}
