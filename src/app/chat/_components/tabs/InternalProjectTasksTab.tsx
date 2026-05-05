"use client";

/**
 * Internal Projects "Tasks" tab — renders the InternalProjectKanban from
 * `/internal-projects?project=<id>` inside the chat layout. Mirrors the
 * Client/QA Request tab wrappers: fetch a bundle on mount + 2 s poll, then
 * pass straight into the kanban.
 */

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/projects";
import type {
  InternalKeyResultRef,
  InternalProject,
  InternalProjectAssignee,
  InternalTask,
  InternalTaskTimeTrack,
} from "@/types/internal-projects";
import InternalProjectKanban from "@/app/internal-projects/_components/InternalProjectKanban";
import { getInternalProjectTaskBundle } from "../../actions";

interface Props {
  internalProjectId: string;
  currentUserId: string;
}

interface State {
  project: InternalProject;
  tasks: InternalTask[];
  profiles: UserProfile[];
  projectAssignees: InternalProjectAssignee[];
  timeTracks: InternalTaskTimeTrack[];
  keyResults: InternalKeyResultRef[];
}

const POLL_MS = 2000;

export default function InternalProjectTasksTab({ internalProjectId, currentUserId }: Props) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      const b = await getInternalProjectTaskBundle(internalProjectId);
      if (cancelled || !b.project) return;
      setState({
        project: b.project as unknown as InternalProject,
        tasks: b.tasks as unknown as InternalTask[],
        profiles: b.profiles as unknown as UserProfile[],
        projectAssignees: b.projectAssignees as unknown as InternalProjectAssignee[],
        timeTracks: b.timeTracks as unknown as InternalTaskTimeTrack[],
        keyResults: b.keyResults as unknown as InternalKeyResultRef[],
      });
    }

    void load();
    timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [internalProjectId]);

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <InternalProjectKanban
        project={state.project}
        tasks={state.tasks}
        profiles={state.profiles}
        projectAssignees={state.projectAssignees}
        timeTracks={state.timeTracks}
        keyResults={state.keyResults}
        currentUserId={currentUserId}
      />
    </div>
  );
}
