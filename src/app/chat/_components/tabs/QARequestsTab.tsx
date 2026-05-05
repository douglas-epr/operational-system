"use client";

/**
 * QA Requests tab — TasksKanban scoped to type="qa_requests" with the
 * "Track QA Time" button + QATimeTrackerModal wired up (mirrors the
 * /projects ProjectDetail behaviour).
 */

import { useEffect, useRef, useState } from "react";
import type { ChatBlock } from "@/types/chat";
import type { Task, UserProfile, UserType } from "@/types/projects";
import TasksKanban from "@/app/projects/_components/tabs/TasksKanban";
import QATimeTrackerModal from "@/app/projects/_components/modals/QATimeTrackerModal";
import { getProjectTabBundle } from "../../actions";

interface Props {
  projectId: string;
  block: Exclude<ChatBlock, "chatbot">;
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

export default function QARequestsTab({ projectId, userType, currentUserId, onCounts }: Props) {
  const [state, setState] = useState<State | null>(null);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const onCountsRef = useRef(onCounts);
  onCountsRef.current = onCounts;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
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
        const filtered = newState.tasks.filter((t) => t.type === "qa_requests");
        const blue =
          userType === "qa"
            ? filtered.filter((t) => t.status === "ready_for_qa").length
            : filtered.filter((t) => t.status === "not_started").length;
        const red = filtered.reduce((s, t) => s + (newState.unreadByTaskId[t.id] ?? 0), 0);
        onCountsRef.current(blue, red);
      }
    }

    void load();
    timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [projectId, userType]);

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  // Milestones (level_1 developer tasks) are needed by the QA tracker modal
  // to group entries — same logic as ProjectDetail.tsx:53.
  const milestones = state.tasks.filter(
    (t) => t.type === "developer_tasks" && t.level === "level_1" && !t.parent_task_id
  );

  return (
    <div className="flex-1 overflow-auto px-4 py-4">
      <TasksKanban
        tasks={state.tasks}
        userType={userType as UserType | null}
        projectId={projectId}
        type="qa_requests"
        profiles={state.profiles}
        currentUserId={currentUserId}
        authorizedUserIds={state.authorizedUserIds}
        unreadByTaskId={state.unreadByTaskId}
        milestones={milestones}
        onTrackQATime={() => setTrackerOpen(true)}
      />
      <QATimeTrackerModal
        open={trackerOpen}
        onClose={() => setTrackerOpen(false)}
        projectId={projectId}
        milestones={milestones}
      />
    </div>
  );
}
