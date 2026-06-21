/**
 * Apify client (Phase 2 sourcing). Server-only.
 *
 * Scrapers are long-running, so we use the async pattern: start a run (returns
 * instantly), then poll + import the dataset when it SUCCEEDs. The canonical
 * Google Maps scraper is compass/crawler-google-places (id nwua9Gu5YrADL7ZDj),
 * whose input schema was introspected live.
 */

import "server-only";
import type { ReferenceSourceKey } from "@/types/marketing";

const BASE = "https://api.apify.com/v2";
export const GOOGLE_MAPS_ACTOR = "nwua9Gu5YrADL7ZDj"; // compass/crawler-google-places

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("Missing env: APIFY_TOKEN");
  return t;
}

/** Auth via header (never the query string — query strings leak into logs/APM). */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${token()}`, ...(extra ?? {}) };
}

/** Default timeout for short Apify control-plane calls (start/poll/fetch). */
const APIFY_API_TIMEOUT_MS = 30_000;

/** Non-throwing token accessor for capability checks. */
function tokenOrNull(): string | null {
  return process.env.APIFY_TOKEN ?? null;
}

export interface ApifyRun {
  id: string;
  status: string; // READY | RUNNING | SUCCEEDED | FAILED | ABORTED | TIMED-OUT
  datasetId: string | null;
}

/** Start an actor run. Returns immediately with the run id + dataset id. */
export async function startActorRun(
  actorId: string,
  input: Record<string, unknown>
): Promise<ApifyRun> {
  const res = await fetch(`${BASE}/acts/${actorId}/runs`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(APIFY_API_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Apify start failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const j = (await res.json()) as {
    data: { id: string; status: string; defaultDatasetId?: string };
  };
  return { id: j.data.id, status: j.data.status, datasetId: j.data.defaultDatasetId ?? null };
}

/** Poll a run's status. */
export async function getRun(runId: string): Promise<ApifyRun> {
  const res = await fetch(`${BASE}/actor-runs/${runId}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(APIFY_API_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Apify getRun failed: ${res.status}`);
  const j = (await res.json()) as {
    data: { id: string; status: string; defaultDatasetId?: string };
  };
  return { id: j.data.id, status: j.data.status, datasetId: j.data.defaultDatasetId ?? null };
}

/** Fetch cleaned dataset items. */
export async function getDatasetItems(
  datasetId: string,
  limit = 1000
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${BASE}/datasets/${datasetId}/items?clean=true&format=json&limit=${limit}`,
    { headers: authHeaders(), signal: AbortSignal.timeout(APIFY_API_TIMEOUT_MS) }
  );
  if (!res.ok) {
    console.error(`[apify] getDatasetItems ${datasetId} failed: ${res.status}`);
    return [];
  }
  return (await res.json().catch(() => [])) as Record<string, unknown>[];
}

// ── Google Maps sourcing ──────────────────────────────────────────────────────

export interface GoogleMapsParams {
  searchTerms: string[];
  location: string;
  maxResults: number;
  /** Enrich emails + socials from each business website (costs more on Apify). */
  scrapeContacts: boolean;
  /** Only return places that have a website (needed for contact enrichment). */
  onlyWithWebsite?: boolean;
}

/** Build the actor input from our simplified params. */
export function buildGoogleMapsInput(p: GoogleMapsParams): Record<string, unknown> {
  return {
    searchStringsArray: p.searchTerms,
    locationQuery: p.location,
    maxCrawledPlacesPerSearch: Math.min(Math.max(p.maxResults, 1), 200),
    language: "en",
    scrapeContacts: p.scrapeContacts,
    ...(p.onlyWithWebsite ? { website: "withWebsite" } : {}),
    skipClosedPlaces: true,
  };
}

/** Normalized prospect extracted from a sourcing result (place or lead). */
export interface NormalizedProspect {
  company: string | null;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin_url: string | null;
  raw: Record<string, unknown>;
}

function firstString(v: unknown): string | null {
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
  if (typeof v === "string") return v;
  return null;
}

/** Map a Google Maps place (with optional contact enrichment) to a prospect. */
export function mapPlaceToProspect(place: Record<string, unknown>): NormalizedProspect {
  const title = (place.title as string) ?? null;
  return {
    company: title,
    name: title, // business name (place results are businesses, not people)
    title: null,
    email: firstString(place.emails) ?? null,
    phone: (place.phone as string) ?? firstString(place.phones) ?? null,
    website: (place.website as string) ?? null,
    linkedin_url: firstString(place.linkedIns) ?? null,
    raw: place,
  };
}

// ── B2B people search (Apollo alternative) ────────────────────────────────────
// Actor: code_crafter/leads-finder — queries a 250M+ contact database (no Apollo
// account needed), bypassing Apollo's gated free-plan search. Pay-per-lead.
export const LEADS_ACTOR = "IoSHqwTR9YGhzccez"; // code_crafter/leads-finder

export interface LeadsParams {
  jobTitles: string[];
  seniority: string[]; // enum values: founder|owner|c_suite|director|vp|head|manager|senior|entry
  locations: string[]; // free text, lowercased (e.g. "united kingdom")
  keywords: string[]; // company keywords
  maxResults: number;
}

/** Build the leads-finder input from our simplified params. */
export function buildLeadsInput(p: LeadsParams): Record<string, unknown> {
  return {
    fetch_count: Math.min(Math.max(p.maxResults, 1), 1000),
    file_name: "Move37 prospects",
    email_status: ["validated"],
    ...(p.jobTitles.length ? { contact_job_title: p.jobTitles } : {}),
    ...(p.seniority.length ? { seniority_level: p.seniority } : {}),
    ...(p.locations.length
      ? { contact_location: p.locations.map((l) => l.toLowerCase()) }
      : {}),
    ...(p.keywords.length ? { company_keywords: p.keywords } : {}),
  };
}

/** Map a leads-finder person record to a prospect. */
export function mapLeadToProspect(lead: Record<string, unknown>): NormalizedProspect {
  const str = (k: string) => {
    const v = lead[k];
    return typeof v === "string" && v.trim() ? v : null;
  };
  const joined = [str("first_name"), str("last_name")].filter(Boolean).join(" ");
  const name = str("full_name") ?? (joined || null);
  return {
    company: str("company_name"),
    name,
    title: str("job_title") ?? str("headline"),
    email: str("email") ?? str("personal_email"),
    phone: str("mobile_number") ?? str("company_phone"),
    website: str("company_website") ?? str("company_domain"),
    linkedin_url: str("linkedin"),
    raw: lead,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Social Discovery Pipeline — multi-stage Apify orchestration
//
// Stage 0 — Priority Seeds (reference source URLs from positioning page)
// Stage 1 — Keyword Discovery (bio search + content search per platform)
// Stage 2 — LinkedIn Enrichment (harvestapi email mode)
// Stage 3 — Website Email Extraction (pro100chok/extract-emails)
// ════════════════════════════════════════════════════════════════════════════

export type SocialPlatform = "linkedin" | "instagram" | "facebook" | "youtube" | "twitter" | "tiktok";
export type DiscoveryMode = "bio" | "content" | "both";

export interface SocialActorRun {
  runId: string;
  status: string;
  datasetId?: string;
}

/** Inject location into keyword list for actors without native location support. */
export function buildLocationKeywords(keywords: string[], location: string): string[] {
  if (!location.trim()) return keywords;
  const loc = location.trim();
  const expanded: string[] = [];
  for (const kw of keywords) {
    expanded.push(kw, `${kw} ${loc}`);
  }
  return [...new Set(expanded)];
}

/** Normalised profile record produced by Stage 0/1 actors (before enrichment). */
export interface NormalizedSocialProfile {
  platform: SocialPlatform;
  name: string | null;
  email: string | null;
  profile_url: string | null;
  company: string | null;
  title: string | null;
  website: string | null;
  priority: boolean;
}

// ── Actor IDs ─────────────────────────────────────────────────────────────────
const ACTORS = {
  // Path A — bio/profile search
  linkedin_bio:     "powerai/linkedin-peoples-search-scraper",
  instagram_bio:    "data-slayer/instagram-search-users",
  facebook_bio:     "apify/facebook-search-scraper",
  youtube_bio:      "oneary/youtube-channel-emails",
  twitter_bio:      "xtdata/twitter-x-user-search-scraper",
  tiktok_bio:       "lurkapi/tiktok-profile-email-scraper",
  // Path B — post/content search
  linkedin_content: "unseenuser/LinkedIn-Post-Seach-Scraper",
  instagram_content:"sasky/instagram-keyword-posts-urls-scraper",
  facebook_content: "scrapeforge/facebook-search-posts",
  youtube_content:  "truefetch/youtube-niche-listing",
  twitter_content:  "habit.zhou/twitter-pro-scraper",
  tiktok_content:   "logiover/tiktok-creator-lead-finder",
  // Enrichment
  linkedin_enrich:  "harvestapi/linkedin-profile-scraper",
  website_emails:   "pro100chok/extract-emails",
} as const;

async function fireActor(actorId: string, input: Record<string, unknown>): Promise<SocialActorRun> {
  const run = await startActorRun(actorId, input);
  return { runId: run.id, status: run.status, datasetId: run.datasetId ?? undefined };
}

// ── Path A: Bio / Profile search ─────────────────────────────────────────────

export async function startLinkedInBioSearch(keywords: string[], location: string, maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.linkedin_bio, {
    keywords: keywords.join(" OR "),
    geocode_location: location || undefined,
    count: maxResults,
  });
}

export async function startInstagramBioSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.instagram_bio, { query: keywords.join(" "), maxItems: maxResults, mode: "verified" });
}

export async function startFacebookBioSearch(keywords: string[], location: string, maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.facebook_bio, {
    categories: keywords,
    ...(location ? { locations: [location] } : {}),
    resultsLimit: maxResults,
  });
}

export async function startYouTubeBioSearch(keywords: string[], location: string, maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.youtube_bio, {
    query: keywords.join(" "),
    maxItems: maxResults,
    ...(location ? { locationName: location } : {}),
  });
}

export async function startTwitterBioSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.twitter_bio, { searchTerms: keywords, maxItems: maxResults });
}

export async function startTikTokBioSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.tiktok_bio, { keywords, crawlBioLinks: true, crossPlatformPivot: true, maxItems: maxResults });
}

// ── Path B: Post / Content search ────────────────────────────────────────────

export async function startLinkedInContentSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.linkedin_content, { keywords: keywords.join(" "), count: maxResults });
}

export async function startInstagramContentSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.instagram_content, { keywords, maxItems: maxResults });
}

export async function startFacebookContentSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.facebook_content, { keywords, type: "posts", limit: maxResults });
}

export async function startYouTubeContentSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.youtube_content, { keyword: keywords[0] ?? "", sort: "relevance", max: maxResults });
}

export async function startTwitterContentSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.twitter_content, { keywords, mode: "search", maxItems: maxResults });
}

export async function startTikTokContentSearch(keywords: string[], maxResults: number): Promise<SocialActorRun> {
  return fireActor(ACTORS.tiktok_content, { keywords, maxItems: maxResults });
}

// ── Enrichment ────────────────────────────────────────────────────────────────

export async function startLinkedInEnrichment(profileUrls: string[]): Promise<SocialActorRun> {
  return fireActor(ACTORS.linkedin_enrich, { profileUrls, getEmails: true });
}

/** Start one website email extraction run (pass at most 100 URLs per run). */
export async function startWebsiteEmailExtraction(websiteUrls: string[]): Promise<SocialActorRun> {
  return fireActor(ACTORS.website_emails, { startUrls: websiteUrls.map((url) => ({ url })) });
}

// ── Result normalisers (per platform, both paths) ─────────────────────────────

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function firstArr(v: unknown): string | null {
  if (Array.isArray(v)) return s(v[0] ?? null);
  return s(v);
}

export function normaliseLinkedInBioItem(item: Record<string, unknown>): NormalizedSocialProfile {
  return {
    platform: "linkedin",
    name: s(item.fullName) ?? ([s(item.firstName), s(item.lastName)].filter(Boolean).join(" ") || null),
    email: firstArr(item.emails) ?? s(item.email),
    profile_url: s(item.linkedinUrl) ?? s(item.profileUrl),
    title: s(item.headline) ?? s(item.title),
    company: s(item.company) ?? s(item.currentCompany),
    website: s(item.website) ?? s(item.websiteUrl),
    priority: false,
  };
}

export function normaliseLinkedInContentItem(item: Record<string, unknown>): NormalizedSocialProfile {
  return {
    platform: "linkedin",
    name: s(item.authorName) ?? s(item.author),
    email: null,
    profile_url: s(item.authorLinkedinUrl) ?? s(item.linkedinUrl),
    title: s(item.authorHeadline) ?? s(item.headline),
    company: null,
    website: null,
    priority: false,
  };
}

export function normaliseInstagramItem(item: Record<string, unknown>): NormalizedSocialProfile {
  const username = s(item.username) ?? s(item.user_name);
  return {
    platform: "instagram",
    name: s(item.full_name) ?? s(item.fullName) ?? username,
    email: s(item.public_email) ?? s(item.email),
    profile_url: username ? `https://instagram.com/${username}` : s(item.profile_url),
    title: s(item.biography) ?? s(item.bio),
    company: null,
    website: s(item.external_url) ?? s(item.website),
    priority: false,
  };
}

export function normaliseFacebookItem(item: Record<string, unknown>): NormalizedSocialProfile {
  return {
    platform: "facebook",
    name: s(item.pageName) ?? s(item.name) ?? s(item.authorName),
    email: s(item.email),
    profile_url: s(item.pageUrl) ?? s(item.url) ?? s(item.authorUrl),
    title: s(item.category) ?? s(item.description),
    company: s(item.pageName) ?? s(item.name),
    website: s(item.website),
    priority: false,
  };
}

export function normaliseYouTubeItem(item: Record<string, unknown>): NormalizedSocialProfile {
  const channelUrl = s(item.channel_url) ?? s(item.channelUrl) ?? s(item.url);
  return {
    platform: "youtube",
    name: s(item.channel_name) ?? s(item.channelName) ?? s(item.title),
    email: firstArr(item.emails) ?? s(item.email) ?? s(item.contact_email),
    profile_url: channelUrl,
    title: s(item.description),
    company: null,
    website: s(item.website) ?? s(item.channelHandle),
    priority: false,
  };
}

export function normaliseTwitterItem(item: Record<string, unknown>): NormalizedSocialProfile {
  const handle = s(item.screenName) ?? s(item.username) ?? s(item.handle);
  return {
    platform: "twitter",
    name: s(item.name) ?? handle,
    email: null,
    profile_url: handle ? `https://x.com/${handle}` : s(item.url),
    title: s(item.description) ?? s(item.bio),
    company: null,
    website: s(item.entities_url) ?? s(item.websiteUrl) ?? s(item.website),
    priority: false,
  };
}

export function normaliseTikTokItem(item: Record<string, unknown>): NormalizedSocialProfile {
  const username = s(item.username) ?? s(item.user_name);
  return {
    platform: "tiktok",
    name: s(item.nickname) ?? s(item.displayName) ?? username,
    email: firstArr(item.emails) ?? s(item.email),
    profile_url: s(item.profileUrl) ?? (username ? `https://tiktok.com/@${username}` : null),
    title: s(item.bio) ?? s(item.signature),
    company: null,
    website: s(item.bioLink) ?? s(item.website),
    priority: false,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Reference research scraping (marketing content pipeline)
//
// Each platform's reference-source list is scraped by a dedicated Apify actor
// (all confirmed in the Apify Store). Runs are BOUNDED (few accounts, few posts)
// to stay within the function budget, and summarized into a short text `digest`
// the Researcher agent reads cheaply. "Posts" lists with no clean account-based
// actor are surfaced verbatim as reference links to emulate.
// ════════════════════════════════════════════════════════════════════════════

const MAX_ACCOUNTS_PER_SOURCE = 3;
const MAX_ITEMS_PER_ACCOUNT = 5;
const RESEARCH_RUN_TIMEOUT_MS = 120_000;

/** Run an actor synchronously and return its dataset items (bounded research). */
async function runActorSync<T = Record<string, unknown>>(
  actorId: string,
  input: Record<string, unknown>
): Promise<T[]> {
  const path = actorId.replace("/", "~"); // "user/name" → "user~name"
  const url = `${BASE}/acts/${path}/run-sync-get-dataset-items`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(RESEARCH_RUN_TIMEOUT_MS),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Apify ${actorId} ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json().catch(() => [])) as T[];
}

/** Extract a bare username from a profile URL (instagram.com/nasa → nasa). */
export function handleFromUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    const seg = u.pathname.split("/").filter(Boolean)[0] ?? "";
    return seg.replace(/^@/, "");
  } catch {
    return url.trim().replace(/^@/, "");
  }
}

function clip(s: string, n = 180): string {
  const clean = (s ?? "").replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}
const rStr = (v: unknown): string => (typeof v === "string" ? v : "");
const rNum = (v: unknown): number => (typeof v === "number" ? v : 0);

type ResearchRow = Record<string, unknown>;

interface ReferenceScraper {
  actorId: string;
  buildInput: (urls: string[]) => Record<string, unknown>;
  summarize: (rows: ResearchRow[]) => string[];
}

/** Account/channel-based scrapers, keyed by reference source. */
const REFERENCE_SCRAPERS: Partial<Record<ReferenceSourceKey, ReferenceScraper>> = {
  websites: {
    actorId: "apify/website-content-crawler",
    buildInput: (urls) => ({
      startUrls: urls.map((url) => ({ url })),
      maxCrawlPages: urls.length,
      maxCrawlDepth: 0,
      proxyConfiguration: { useApifyProxy: true },
      saveMarkdown: true,
    }),
    summarize: (rows) =>
      rows.map((r) => `${clip(rStr(r.title) || rStr(r.url), 80)} — ${clip(rStr(r.text) || rStr(r.markdown), 200)}`),
  },
  google_business_posts: {
    actorId: "scrapeforge/google-reviews-scraper",
    buildInput: (urls) => ({ placeURLs: urls, maxReviewsPerPlace: MAX_ITEMS_PER_ACCOUNT, sortBy: "newest" }),
    summarize: (rows) => rows.map((r) => `★${rNum(r.stars) || rNum(r.rating)} — ${clip(rStr(r.text) || rStr(r.reviewText))}`),
  },
  instagram_users: {
    actorId: "instagram-scraper/instagram-profile-posts-scraper",
    buildInput: (urls) => ({ instagramUsernames: urls.map(handleFromUrl).filter(Boolean), postsPerProfile: MAX_ITEMS_PER_ACCOUNT }),
    summarize: (rows) =>
      rows.map((r) => `❤${rNum(r.like_count) || rNum(r.likesCount)} 💬${rNum(r.comment_count) || rNum(r.commentsCount)} — ${clip(rStr(r.caption))}`),
  },
  linkedin_users: {
    actorId: "harvestapi/linkedin-profile-posts",
    buildInput: (urls) => ({ targetUrls: urls, maxPosts: MAX_ITEMS_PER_ACCOUNT }),
    summarize: (rows) => rows.map((r) => `👍${rNum(r.likesCount) || rNum(r.reactionsCount)} — ${clip(rStr(r.content) || rStr(r.text))}`),
  },
  youtube_channels: {
    actorId: "grow_media/youtube-channel-video-scraper",
    buildInput: (urls) => ({ channelUrls: urls, maxResults: MAX_ITEMS_PER_ACCOUNT, sortOrder: "popular" }),
    summarize: (rows) => rows.map((r) => `▶${rNum(r.viewCount) || rNum(r.views)} views — ${clip(rStr(r.title))}`),
  },
  twitter_users: {
    actorId: "xquik/x-tweet-scraper",
    buildInput: (urls) => ({ startUrls: urls, maxItems: MAX_ITEMS_PER_ACCOUNT * MAX_ACCOUNTS_PER_SOURCE }),
    summarize: (rows) =>
      rows.map((r) => `🔁${rNum(r.retweetCount)} ❤${rNum(r.likeCount) || rNum(r.favoriteCount)} — ${clip(rStr(r.text) || rStr(r.full_text))}`),
  },
  tiktok_users: {
    actorId: "renzomacar/tiktok-scraper",
    buildInput: (urls) => ({ profileUrls: urls, maxPostsPerProfile: MAX_ITEMS_PER_ACCOUNT }),
    summarize: (rows) =>
      rows.map((r) => `▶${rNum(r.playCount) || rNum(r.views)} ❤${rNum(r.diggCount) || rNum(r.likes)} — ${clip(rStr(r.text) || rStr(r.desc))}`),
  },
};

/** Facebook actor takes a single page_url → looped per URL. */
const FACEBOOK_SCRAPER = {
  actorId: "danek/facebook-pages-posts-ppe",
  buildInput: (url: string) => ({ page_url: url, max_posts: MAX_ITEMS_PER_ACCOUNT }),
  summarize: (rows: ResearchRow[]): string[] =>
    rows.map((r) => `👍${rNum(r.likes) || rNum(r.reactionsCount)} — ${clip(rStr(r.text) || rStr(r.message))}`),
};

/** Post/video lists surfaced verbatim (no clean account-based actor). */
const PASSTHROUGH_REFERENCE_KEYS: ReferenceSourceKey[] = [
  "instagram_posts", "linkedin_posts", "youtube_videos",
  "facebook_posts", "twitter_posts", "tiktok_posts",
];

export interface ReferenceScrapeResult {
  digest: string;
  raw: unknown;
  ok: boolean;
  error?: string;
}

/** Whether Apify research scraping is configured (token present). */
export function apifyConfigured(): boolean {
  return !!tokenOrNull();
}

/**
 * Register a one-shot webhook on an Apify run that fires on terminal states.
 * callbackUrl should include the sourceRunId + CRON_SECRET so the receiver
 * can authenticate and look up the right DB row without a join.
 * Non-throwing — the cron handles runs where webhook registration fails.
 */
export async function registerRunWebhook(runId: string, callbackUrl: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/actor-runs/${runId}/webhooks`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      signal: AbortSignal.timeout(APIFY_API_TIMEOUT_MS),
      body: JSON.stringify({
        eventTypes: [
          "ACTOR.RUN.SUCCEEDED",
          "ACTOR.RUN.FAILED",
          "ACTOR.RUN.ABORTED",
          "ACTOR.RUN.TIMED_OUT",
        ],
        requestUrl: callbackUrl,
        isAdHoc: true,
      }),
    });
    if (!res.ok) {
      console.warn(`[apify] webhook registration failed for run ${runId}: ${res.status}`);
    }
  } catch (e) {
    console.warn(`[apify] webhook registration error for run ${runId}:`, e);
  }
}

/**
 * Scrape one reference source list → compact digest + raw payload.
 * Bounded by MAX_ACCOUNTS_PER_SOURCE. Never throws (returns ok:false on error).
 */
export async function scrapeReferenceSource(
  sourceKey: ReferenceSourceKey,
  urls: string[]
): Promise<ReferenceScrapeResult> {
  const capped = urls.map((u) => u.trim()).filter(Boolean).slice(0, MAX_ACCOUNTS_PER_SOURCE);
  if (capped.length === 0) return { digest: "", raw: null, ok: true };

  if (PASSTHROUGH_REFERENCE_KEYS.includes(sourceKey)) {
    return {
      digest: `Reference ${sourceKey.replace(/_/g, " ")} to emulate:\n` + capped.map((u) => `- ${u}`).join("\n"),
      raw: { urls: capped },
      ok: true,
    };
  }

  try {
    if (sourceKey === "facebook_users") {
      const all: ResearchRow[] = [];
      for (const url of capped) {
        const rows = await runActorSync<ResearchRow>(FACEBOOK_SCRAPER.actorId, FACEBOOK_SCRAPER.buildInput(url));
        all.push(...rows.slice(0, MAX_ITEMS_PER_ACCOUNT));
      }
      return { digest: FACEBOOK_SCRAPER.summarize(all).join("\n"), raw: all, ok: true };
    }

    const scraper = REFERENCE_SCRAPERS[sourceKey];
    if (!scraper) {
      return { digest: capped.map((u) => `- ${u}`).join("\n"), raw: { urls: capped }, ok: true };
    }

    const rows = await runActorSync<ResearchRow>(scraper.actorId, scraper.buildInput(capped));
    const trimmed = rows.slice(0, MAX_ACCOUNTS_PER_SOURCE * MAX_ITEMS_PER_ACCOUNT);
    return { digest: scraper.summarize(trimmed).join("\n"), raw: trimmed, ok: true };
  } catch (e) {
    return { digest: "", raw: null, ok: false, error: e instanceof Error ? e.message : "Apify scrape failed" };
  }
}
