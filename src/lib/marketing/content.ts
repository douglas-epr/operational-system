/**
 * Content publish worker (Phase 4). Server-only.
 * Publishes due scheduled posts (mkt_content.status='scheduled',
 * scheduled_at <= now) to Buffer, then marks them posted. Run by the Cloudflare
 * Cron Trigger route /api/mkt/cron/process-content.
 */

import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { listChannels, createPost } from "@/lib/api/buffer";
import type { MktContent } from "@/types/marketing";

export interface ContentProcessResult {
  processed: number;
  posted: number;
  failed: number;
  skipped: number;
}

export async function processDueContent(limit = 25): Promise<ContentProcessResult> {
  const sb = createServiceClient();
  const nowIso = new Date().toISOString();
  const result: ContentProcessResult = { processed: 0, posted: 0, failed: 0, skipped: 0 };

  const { data: dueData } = await sb
    .from("mkt_content" as never)
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  const due = (dueData ?? []) as unknown as MktContent[];
  if (due.length === 0) return result;

  // Channels are global to the Buffer workspace — fetch once per run.
  const channels = await listChannels();
  const byId = new Map(channels.map((c) => [c.id, c]));

  for (const post of due) {
    result.processed++;

    const channelIds = (post.channels ?? []).filter((id) => byId.has(id));
    if (!post.body?.trim() || channelIds.length === 0) {
      await sb.from("mkt_content" as never).update({ status: "failed" } as never).eq("id", post.id);
      result.skipped++;
      continue;
    }

    const bufferIds: Record<string, string> = {};
    const externalLinks: Record<string, string> = {};
    let anyError = false;

    for (const channelId of channelIds) {
      const res = await createPost({ channelId, text: post.body, mode: "now" });
      if (res.returned_an_error) {
        anyError = true;
      } else if (res.post) {
        bufferIds[channelId] = res.post.id;
        if (res.post.externalLink) externalLinks[channelId] = res.post.externalLink;
      }
    }

    if (anyError && Object.keys(bufferIds).length === 0) {
      await sb.from("mkt_content" as never).update({ status: "failed" } as never).eq("id", post.id);
      result.failed++;
      continue;
    }

    await sb
      .from("mkt_content" as never)
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        external_post_ids: { buffer_ids: bufferIds, external_links: externalLinks },
      } as never)
      .eq("id", post.id);
    result.posted++;
  }

  return result;
}
