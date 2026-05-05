"use client";

/**
 * useRealtimeMessages
 * ------------------------------------------------------------------
 * Subscribes to Supabase Realtime INSERTs on the matching message
 * table (per block) and forwards new rows into the caller's setState.
 *
 * Pattern mirrors src/app/sandbox-planner/_components/IdeaChatbot.tsx:61-86.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BLOCK_TABLES, type ChatBlock, type ChatMessage } from "@/types/chat";

interface Options {
  block: Exclude<ChatBlock, "chatbot">;
  conversationId: string | null;
  /** Called for each newly inserted top-level message in this conversation. */
  onMessageInsert: (row: ChatMessage) => void;
  /** Called for thread inserts so the parent's thread_count can be bumped. */
  onThreadInsert?: (row: { id: string; parent_id: string }) => void;
}

export function useRealtimeMessages({ block, conversationId, onMessageInsert, onThreadInsert }: Options) {
  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const tables = BLOCK_TABLES[block];
    const channel = supabase
      .channel(`chat:${block}:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tables.msg,
          filter: `${tables.scopeFk}=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          // Column renames in B8: owner_id → created_by, edited_at → updated_at,
          // is_daily_feedback dropped.
          onMessageInsert({
            id: row.id as string,
            scope_id: row[tables.scopeFk] as string,
            created_by: row.created_by as string,
            author_type: (row.author_type as "user" | "chatbot") ?? "user",
            message: (row.message as string) ?? "",
            attachments: (row.attachments as unknown as ChatMessage["attachments"]) ?? [],
            links: (row.links as string[]) ?? [],
            updated_at: (row.updated_at as string | null) ?? null,
            created_at: row.created_at as string,
            thread_count: 0,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tables.thread,
          filter: `${tables.scopeFk}=eq.${conversationId}`,
        },
        (payload) => {
          if (!onThreadInsert) return;
          const row = payload.new as Record<string, unknown>;
          onThreadInsert({ id: row.id as string, parent_id: row.parent_id as string });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [block, conversationId, onMessageInsert, onThreadInsert]);
}
