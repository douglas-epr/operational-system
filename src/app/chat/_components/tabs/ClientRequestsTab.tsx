"use client";

/**
 * Client Requests tab — renders the TasksKanban from /projects, scoped to
 * the active project, filtered to type="client_requests".
 */

import type { ChatBlock } from "@/types/chat";
import TaskRequestsKanbanWrapper from "./TaskRequestsKanbanWrapper";

interface Props {
  projectId: string;
  block: Exclude<ChatBlock, "chatbot">;
  userType: string;
  currentUserId: string;
  onCounts?: (blue: number, red: number) => void;
}

export default function ClientRequestsTab({ projectId, userType, currentUserId, onCounts }: Props) {
  return (
    <TaskRequestsKanbanWrapper
      projectId={projectId}
      type="client_requests"
      userType={userType}
      currentUserId={currentUserId}
      onCounts={onCounts}
    />
  );
}
