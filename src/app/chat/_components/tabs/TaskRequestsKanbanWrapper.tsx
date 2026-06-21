"use client";

/**
 * Shared wrapper used by ClientRequestsTab to render the
 * full TasksKanban component from /projects inside the chat layout.
 *
 * Pattern mirrors ProjectTabsPanel: fetch the bundle (tasks + profiles +
 * authorized users + unread counts) on mount, poll every 2 s so writes
 * triggered by the kanban (which call router.refresh()) become visible
 * without a manual reload.
 */

import { useEffect, useRef, useState } from "react";
import type { Task, UserProfile, UserType } from "@/types/projects";
import TasksKanban from "@/app/projects/_components/tabs/TasksKanban";
import { getProjectTabBundle } from "../../actions";

interface Props {
  projectId: string;
  type: "client_requests";
  userType: string;
  currentUserId: string;
  onCounts?: (blue: number, red: number) => void;
}

interface State {
  tasks: Task[];
  profiles: UserProfile[];
  authorizedUserIds: string[];
  unreadByTaskId: Record<string, number>;
}

const POLL_MS = 2000;

export default function TaskRequestsKanbanWrapper({
  projectId,
  type,
  userType,
  currentUserId,
  onCounts,
}: Props) {
  const [state, setState] = useState<State | null>(null);
  const onCountsRef = useRef(onCounts);
  onCountsRef.current = onCounts;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    async function load() {
      // Skip if a previous poll is still running — otherwise slow responses
      // stack up and flood the shared server-action queue, starving user saves.
      if (inFlight) return;
      inFlight = true;
      try {
        const bundle = await getProjectTabBundle(projectId);
        if (cancelled) return;
        const newState: State = {
          tasks: bundle.tasks as unknown as Task[],
          profiles: bundle.profiles as unknown as UserProfile[],
          authorizedUserIds: bundle.authorizedUserIds,
          unreadByTaskId: bundle.unreadByTaskId,
        };
        setState(newState);
        if (onCountsRef.current) {
          const filtered = newState.tasks.filter((t) => t.type === type);
          const blue = filtered.filter((t) => t.status === "not_started").length;
          const red = filtered.reduce((s, t) => s + (newState.unreadByTaskId[t.id] ?? 0), 0);
          onCountsRef.current(blue, red);
        }
      } finally {
        inFlight = false;
      }
    }

    void load();
    // Only poll while the tab is visible to avoid background-tab flooding.
    timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [projectId, type, userType]);

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-4 py-4">
      <TasksKanban
        tasks={state.tasks}
        userType={userType as UserType | null}
        projectId={projectId}
        type={type}
        profiles={state.profiles}
        currentUserId={currentUserId}
        authorizedUserIds={state.authorizedUserIds}
        unreadByTaskId={state.unreadByTaskId}
      />
    </div>
  );
}
