/**
 * Sourcing import core (Phase 2). Server-only.
 * Polls Apify runs recorded in mkt_source_run and, when SUCCEEDED, ingests the
 * dataset into mkt_prospect (deduped by project+email). Shared by the manual
 * "Sync" action and the /api/mkt/cron/sync-sourcing worker.
 */

import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import {
  getRun,
  getDatasetItems,
  mapPlaceToProspect,
  mapLeadToProspect,
  startLinkedInEnrichment,
  startWebsiteEmailExtraction,
  normaliseLinkedInBioItem,
  normaliseLinkedInContentItem,
  normaliseInstagramItem,
  normaliseFacebookItem,
  normaliseYouTubeItem,
  normaliseTwitterItem,
  normaliseTikTokItem,
  type SocialActorRun,
  type NormalizedSocialProfile,
  type SocialPlatform,
} from "@/lib/api/apify";

type SB = ReturnType<typeof createServiceClient>;

interface SourceRunRow {
  id: string;
  idea_id: string;
  status: string;
  channel: string;
  apify_dataset_ref: string | null;
  query?: Record<string, unknown>;
}

// ── Social Discovery Stage Machine ────────────────────────────────────────────

type SocialStage = "0_and_1" | "2" | "3" | "done";

interface SocialQuery {
  type: "social_discovery";
  stage: SocialStage;
  stage0?: Record<string, SocialActorRun>;
  stage1a: Partial<Record<SocialPlatform, SocialActorRun>>;
  stage1b: Partial<Record<SocialPlatform, SocialActorRun>>;
  stage2?: { linkedin: SocialActorRun };
  stage3?: SocialActorRun[];
  collected: {
    linkedin_urls: string[];
    website_urls: string[];
    resolved_profiles: NormalizedSocialProfile[];
  };
}

type PlatformNormaliser = (item: Record<string, unknown>) => NormalizedSocialProfile;

const NORMALISERS: Record<string, { bio: PlatformNormaliser; content: PlatformNormaliser }> = {
  linkedin:  { bio: normaliseLinkedInBioItem, content: normaliseLinkedInContentItem },
  instagram: { bio: normaliseInstagramItem,   content: normaliseInstagramItem },
  facebook:  { bio: normaliseFacebookItem,    content: normaliseFacebookItem },
  youtube:   { bio: normaliseYouTubeItem,     content: normaliseYouTubeItem },
  twitter:   { bio: normaliseTwitterItem,     content: normaliseTwitterItem },
  tiktok:    { bio: normaliseTikTokItem,      content: normaliseTikTokItem },
};

function dedup(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))];
}

/** Poll a SocialActorRun; returns true if terminal (SUCCEEDED | FAILED | ABORTED). */
async function pollRun(r: SocialActorRun): Promise<{ done: boolean; succeeded: boolean; datasetId: string | null }> {
  try {
    const run = await getRun(r.runId);
    r.status = run.status;
    if (run.datasetId) r.datasetId = run.datasetId;
    const done = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status);
    return { done, succeeded: run.status === "SUCCEEDED", datasetId: run.datasetId };
  } catch {
    return { done: false, succeeded: false, datasetId: null };
  }
}

async function fetchProfiles(
  run: SocialActorRun,
  normalise: PlatformNormaliser,
  priority: boolean
): Promise<NormalizedSocialProfile[]> {
  if (!run.datasetId) return [];
  const items = await getDatasetItems(run.datasetId, 500);
  return items.map((item) => ({ ...normalise(item), priority }));
}

/** Stage 0+1 → advance to stage 2 or 3 or done. */
async function advanceFromStage1(sb: SB, run: SourceRunRow, q: SocialQuery): Promise<void> {
  const allRuns: SocialActorRun[] = [
    ...Object.values(q.stage0 ?? {}),
    ...Object.values(q.stage1a),
    ...Object.values(q.stage1b),
  ];

  // Poll everything; if any still running → skip this tick.
  for (const r of allRuns) await pollRun(r);
  if (allRuns.some((r) => r.status === "RUNNING" || r.status === "READY")) return;

  const profiles: NormalizedSocialProfile[] = [];

  // Stage 0 — priority seeds
  for (const [platformKey, actorRun] of Object.entries(q.stage0 ?? {})) {
    if (actorRun.status !== "SUCCEEDED" || !actorRun.datasetId) continue;
    const normaliser = NORMALISERS[platformKey]?.bio ?? normaliseLinkedInBioItem;
    const fetched = await fetchProfiles(actorRun, normaliser, true);
    profiles.push(...fetched);
  }

  // Stage 1a bio runs
  for (const [platform, actorRun] of Object.entries(q.stage1a) as [SocialPlatform, SocialActorRun][]) {
    if (actorRun.status !== "SUCCEEDED" || !actorRun.datasetId) continue;
    const fetched = await fetchProfiles(actorRun, NORMALISERS[platform].bio, false);
    profiles.push(...fetched);
  }

  // Stage 1b content runs
  for (const [platform, actorRun] of Object.entries(q.stage1b) as [SocialPlatform, SocialActorRun][]) {
    if (actorRun.status !== "SUCCEEDED" || !actorRun.datasetId) continue;
    const fetched = await fetchProfiles(actorRun, NORMALISERS[platform].content, false);
    profiles.push(...fetched);
  }

  q.collected.resolved_profiles.push(...profiles);

  // Extract URLs for downstream stages
  const newLinkedIn = profiles
    .filter((p) => p.platform === "linkedin" && p.profile_url && !p.email)
    .map((p) => p.profile_url!);
  const newWebsites = profiles
    .filter((p) => p.website && !p.email)
    .map((p) => p.website!);

  q.collected.linkedin_urls = dedup([...q.collected.linkedin_urls, ...newLinkedIn]);
  q.collected.website_urls  = dedup([...q.collected.website_urls,  ...newWebsites]);

  if (q.collected.linkedin_urls.length > 0) {
    try {
      const enrichRun = await startLinkedInEnrichment(q.collected.linkedin_urls.slice(0, 100));
      q.stage2 = { linkedin: enrichRun };
      q.stage = "2";
    } catch {
      // LinkedIn enrichment failed to start — fall through to website extraction
    }
  }

  if (q.stage !== "2") {
    if (q.collected.website_urls.length > 0) {
      try {
        const emailRun = await startWebsiteEmailExtraction(q.collected.website_urls.slice(0, 100));
        q.stage3 = [emailRun];
        q.stage = "3";
      } catch { /* skip */ }
    } else {
      q.stage = "done";
    }
  }

  await sb.from("mkt_source_run" as never).update({ query: q as never } as never).eq("id", run.id);
}

/** Stage 2 (LinkedIn enrichment) → advance to stage 3 or done. */
async function advanceFromStage2(sb: SB, run: SourceRunRow, q: SocialQuery): Promise<void> {
  if (!q.stage2) { q.stage = "done"; return; }
  const { done, succeeded, datasetId } = await pollRun(q.stage2.linkedin);
  if (!done) {
    await sb.from("mkt_source_run" as never).update({ query: q as never } as never).eq("id", run.id);
    return;
  }

  if (succeeded && datasetId) {
    const items = await getDatasetItems(datasetId, 500);
    for (const item of items) {
      const p = normaliseLinkedInBioItem(item);
      if (p.email) {
        // Attach email to matching profile already in collected (by profile_url match)
        const existing = q.collected.resolved_profiles.find(
          (r) => r.platform === "linkedin" && r.profile_url === p.profile_url
        );
        if (existing) { existing.email = p.email; }
        else { q.collected.resolved_profiles.push(p); }
      }
      if (p.website) q.collected.website_urls = dedup([...q.collected.website_urls, p.website]);
    }
  }

  if (q.collected.website_urls.length > 0) {
    try {
      const emailRun = await startWebsiteEmailExtraction(q.collected.website_urls.slice(0, 100));
      q.stage3 = [emailRun];
      q.stage = "3";
    } catch { q.stage = "done"; }
  } else {
    q.stage = "done";
  }

  await sb.from("mkt_source_run" as never).update({ query: q as never } as never).eq("id", run.id);
}

/** Stage 3 (website email extraction) → import all and mark done. */
async function advanceFromStage3(sb: SB, run: SourceRunRow, q: SocialQuery): Promise<number> {
  if (!q.stage3?.length) { q.stage = "done"; return 0; }

  for (const r of q.stage3) await pollRun(r);
  if (q.stage3.some((r) => r.status === "RUNNING" || r.status === "READY")) {
    await sb.from("mkt_source_run" as never).update({ query: q as never } as never).eq("id", run.id);
    return -1; // still running
  }

  // Merge extracted emails into resolved_profiles by domain match
  for (const r of q.stage3) {
    if (r.status !== "SUCCEEDED" || !r.datasetId) continue;
    const items = await getDatasetItems(r.datasetId, 500);
    for (const item of items) {
      const emails: string[] = Array.isArray(item.emails)
        ? (item.emails as string[]).filter((e): e is string => typeof e === "string")
        : typeof item.email === "string" ? [item.email] : [];
      const domain = typeof item.domain === "string" ? item.domain : null;
      for (const email of emails) {
        if (!email) continue;
        const matched = domain
          ? q.collected.resolved_profiles.find(
              (p) => p.website?.includes(domain) || p.profile_url?.includes(domain)
            )
          : null;
        if (matched && !matched.email) { matched.email = email; }
        else if (!matched) {
          q.collected.resolved_profiles.push({
            platform: "linkedin" as SocialPlatform,
            name: typeof item.name === "string" ? item.name : null,
            email,
            profile_url: typeof item.url === "string" ? item.url : null,
            company: null,
            title: null,
            website: typeof item.domain === "string" ? item.domain : null,
            priority: false,
          });
        }
      }
    }
  }

  q.stage = "done";
  return 0; // triggers final import below
}

/** Import all collected profiles to mkt_prospect (priority-first, dedup on email). */
async function importSocialProfiles(
  sb: SB,
  run: SourceRunRow,
  q: SocialQuery
): Promise<number> {
  const sorted = [...q.collected.resolved_profiles].sort((a, b) =>
    a.priority === b.priority ? 0 : a.priority ? -1 : 1
  );

  let inserted = 0;
  for (const p of sorted) {
    if (!p.email && !p.name) continue;
    const { error } = await sb.from("mkt_prospect" as never).insert({
      idea_id: run.idea_id,
      name: p.name,
      email: p.email ? p.email.toLowerCase() : null,
      company: p.company,
      title: p.title,
      linkedin_url: p.platform === "linkedin" ? p.profile_url : null,
      source: `social_discovery_${p.platform}`,
      enrichment: { profile_url: p.profile_url, website: p.website, priority: p.priority },
      source_run_id: run.id,
    } as never);
    if (!error) inserted++;
  }
  return inserted;
}

/** Drive one tick of the social discovery state machine. */
async function importSocialDiscovery(sb: SB, run: SourceRunRow): Promise<SyncResult> {
  const q = run.query as unknown as SocialQuery;

  if (q.stage === "0_and_1") {
    await advanceFromStage1(sb, run, q);
    // If stage advanced to "done" in one shot (no LinkedIn/website URLs found)
    if ((q.stage as string) === "done") {
      const inserted = await importSocialProfiles(sb, run, q);
      await sb.from("mkt_source_run" as never).update({ status: "done", result_count: inserted, query: q as never } as never).eq("id", run.id);
      return { status: "done", inserted, total: q.collected.resolved_profiles.length };
    }
    return { status: "running", inserted: 0, total: 0 };
  }

  if (q.stage === "2") {
    await advanceFromStage2(sb, run, q);
    if ((q.stage as string) === "done") {
      const inserted = await importSocialProfiles(sb, run, q);
      await sb.from("mkt_source_run" as never).update({ status: "done", result_count: inserted, query: q as never } as never).eq("id", run.id);
      return { status: "done", inserted, total: q.collected.resolved_profiles.length };
    }
    return { status: "running", inserted: 0, total: 0 };
  }

  if (q.stage === "3") {
    const still = await advanceFromStage3(sb, run, q);
    if (still === -1) return { status: "running", inserted: 0, total: 0 };
    const inserted = await importSocialProfiles(sb, run, q);
    await sb.from("mkt_source_run" as never).update({ status: "done", result_count: inserted, query: q as never } as never).eq("id", run.id);
    return { status: "done", inserted, total: q.collected.resolved_profiles.length };
  }

  return { status: "done", inserted: 0, total: 0 };
}

export interface SyncResult {
  status: string;
  inserted: number;
  total: number;
}

async function importOne(sb: SB, run: SourceRunRow): Promise<SyncResult> {
  // Social discovery uses a JSONB state machine — dispatch before the single-run path.
  if (run.channel === "social_discovery") {
    return importSocialDiscovery(sb, run);
  }

  if (!run.apify_dataset_ref) {
    await sb.from("mkt_source_run" as never).update({ status: "failed" } as never).eq("id", run.id);
    return { status: "failed", inserted: 0, total: 0 };
  }

  const apifyRun = await getRun(run.apify_dataset_ref);

  // Terminal-but-unsuccessful states.
  if (["FAILED", "ABORTED", "TIMED-OUT"].includes(apifyRun.status)) {
    await sb.from("mkt_source_run" as never).update({ status: "failed" } as never).eq("id", run.id);
    return { status: "failed", inserted: 0, total: 0 };
  }
  // Still going — leave as running.
  if (apifyRun.status !== "SUCCEEDED" || !apifyRun.datasetId) {
    return { status: "running", inserted: 0, total: 0 };
  }

  const items = await getDatasetItems(apifyRun.datasetId, 1000);
  let inserted = 0;

  // Google Maps runs yield business "places"; everything else is people-search
  // ("leads"). The dataset shape differs, so pick the matching mapper + source tag.
  const isPlaces = run.channel === "google_maps";
  const mapItem = isPlaces ? mapPlaceToProspect : mapLeadToProspect;
  const sourceTag = isPlaces ? "apify_google_maps" : "apify_leads";

  // Some actors return an {error: "..."} record instead of data (e.g. a
  // free-plan API gate). Treat that as a failed run, never a prospect.
  const errorItem = items.find(
    (it) => typeof (it as { error?: unknown }).error === "string"
  ) as { error?: string } | undefined;

  for (const item of items) {
    if (typeof (item as { error?: unknown }).error === "string") continue;
    const p = mapItem(item);
    // Never insert a record with no usable identity (avoids blank prospects).
    if (!p.email && !p.name) continue;
    const { error } = await sb.from("mkt_prospect" as never).insert({
      idea_id: run.idea_id,
      name: p.name,
      email: p.email ? p.email.toLowerCase() : null,
      company: p.company,
      title: p.title,
      linkedin_url: p.linkedin_url,
      source: sourceTag,
      enrichment: p.raw,
      source_run_id: run.id,
    } as never);
    // 23505 = duplicate (project+email) — skip quietly.
    if (!error) inserted++;
  }

  // Nothing usable + an actor error → surface as a failed run, not "done".
  if (inserted === 0 && errorItem) {
    await sb.from("mkt_source_run" as never).update({ status: "failed" } as never).eq("id", run.id);
    return { status: "failed", inserted: 0, total: items.length };
  }

  await sb
    .from("mkt_source_run" as never)
    .update({ status: "done", result_count: inserted } as never)
    .eq("id", run.id);

  return { status: "done", inserted, total: items.length };
}

/** Sync a single source run (manual button). */
export async function importSourceRun(sourceRunId: string): Promise<SyncResult> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("mkt_source_run" as never)
    .select("id, idea_id, status, channel, apify_dataset_ref, query")
    .eq("id", sourceRunId)
    .maybeSingle();
  const run = data as unknown as SourceRunRow | null;
  if (!run) return { status: "missing", inserted: 0, total: 0 };
  return importOne(sb, run);
}

/** Sync all still-running source runs (cron). */
export async function importDueSourceRuns(limit = 20): Promise<{ checked: number; imported: number }> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("mkt_source_run" as never)
    .select("id, idea_id, status, channel, apify_dataset_ref, query")
    .eq("status", "running")
    .limit(limit);
  const runs = (data ?? []) as unknown as SourceRunRow[];

  let imported = 0;
  for (const run of runs) {
    const r = await importOne(sb, run);
    if (r.status === "done") imported += r.inserted;
  }
  return { checked: runs.length, imported };
}
