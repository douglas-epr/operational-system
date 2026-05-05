"use client";

/**
 * TabMenu — Messages / Files / Links / Videos / Daily Feedback.
 *
 * Sits above the message stream. URL-driven (?tab=…).
 *
 * Block-aware: only Projects and Projects Internal show all 5 tabs (those
 * are the conversation flavors that have a 1:1 mapping to a project, and
 * therefore can show the project's Files / Links / Videos / Daily Feedback
 * sub-pages — the same UIs /docs uses). Internal Projects and Private
 * conversations only show Messages.
 */

import type { ChatBlock, ChatTab } from "@/types/chat";
import { TAB_LABELS } from "@/types/chat";

interface Props {
  block: Exclude<ChatBlock, "chatbot">;
  active: ChatTab;
  userType: string;
  onChange: (t: ChatTab) => void;
  tabBlueBadge?: Partial<Record<ChatTab, number>>;
  tabRedBadge?: Partial<Record<ChatTab, number>>;
}

const DOC_TABS: ChatTab[] = ["messages", "files", "links", "videos", "daily_feedback"];

/**
 * Per the UX spec: only project-scoped blocks expose the doc-style tabs.
 * Plus per-role visibility for the Client Requests / QA Requests / Chatbot
 * tabs — admins/managers/operationals/developers see Client + QA + Chatbot,
 * clients see Client + Chatbot, QA see QA + Chatbot.
 */
export function tabsForBlock(
  block: Exclude<ChatBlock, "chatbot">,
  userType: string | null
): ChatTab[] {
  if (block === "internal_projects") {
    // Internal Projects (company initiatives) get Messages + Tasks.
    return ["messages", "tasks"];
  }
  if (block !== "projects" && block !== "projects_internal") return ["messages"];
  const role = userType ?? "";
  if (["admin", "manager", "operational", "developer"].includes(role)) {
    return [...DOC_TABS, "client_requests", "qa_requests", "chatbot"];
  }
  if (role === "client") return [...DOC_TABS, "client_requests", "chatbot"];
  if (role === "qa") return [...DOC_TABS, "qa_requests", "chatbot"];
  return DOC_TABS;
}

export default function TabMenu({ block, active, userType, onChange, tabBlueBadge, tabRedBadge }: Props) {
  const tabs = tabsForBlock(block, userType);
  // If the active tab is no longer valid for this block, the parent will
  // re-route on its own (see ConversationPane). We just hide this menu when
  // there's nothing to choose between.
  if (tabs.length <= 1) return null;
  return (
    <div className="flex gap-1 px-4 border-b border-border bg-elevated">
      {tabs.map((t) => {
        const isActive = active === t;
        const blueBadge = tabBlueBadge?.[t] ?? 0;
        const redBadge = tabRedBadge?.[t] ?? 0;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={[
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-accent text-text-primary"
                : "border-transparent text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            <span className="leading-none">{TAB_LABELS[t]}</span>
            {(blueBadge > 0 || redBadge > 0) && (
              <span className="flex items-center gap-1">
                {blueBadge > 0 && (
                  <span
                    title={`${blueBadge} open`}
                    className="min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-info text-white text-[9px] font-semibold leading-none px-1 tabular-nums"
                  >
                    {blueBadge}
                  </span>
                )}
                {redBadge > 0 && (
                  <span
                    title={`${redBadge} unread`}
                    className="min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-danger text-white text-[9px] font-semibold leading-none px-1 tabular-nums"
                  >
                    {redBadge}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
