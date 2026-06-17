"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";

const STAFF = ["admin", "manager"] as const;

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (!STAFF.includes((profile?.type ?? "") as (typeof STAFF)[number])) {
    return { error: "Forbidden." as const };
  }
  return { supabase, user };
}

export interface SeoKeyword {
  id: string;
  idea_id: string;
  keyword: string;
  target_domain: string | null;
  last_rank: number | null;
  last_url: string | null;
  last_checked_at: string | null;
  created_at: string;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listSeoKeywords(
  ideaId: string
): Promise<{ error?: string; data?: SeoKeyword[] }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("mkt_seo_keyword" as never)
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: (data ?? []) as SeoKeyword[] };
}

// ── Add / Remove ──────────────────────────────────────────────────────────────

export async function addSeoKeyword(
  ideaId: string,
  keyword: string,
  targetDomain?: string
): Promise<{ error?: string; data?: SeoKeyword }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const trimmed = keyword.trim();
  if (!trimmed) return { error: "Keyword cannot be empty." };

  const { data, error } = await ctx.supabase
    .from("mkt_seo_keyword" as never)
    .insert({
      idea_id: ideaId,
      keyword: trimmed,
      target_domain: targetDomain?.trim() || null,
      created_by: ctx.user.id,
    } as never)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Keyword already tracked." };
    return { error: error.message };
  }
  return { data: data as SeoKeyword };
}

export async function removeSeoKeyword(
  ideaId: string,
  keywordId: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("mkt_seo_keyword" as never)
    .delete()
    .eq("id", keywordId)
    .eq("idea_id", ideaId);

  if (error) return { error: error.message };
  return {};
}

// ── Rank refresh (Apify Google Search scraper) ───────────────────────────────

interface GoogleSearchResult {
  url?: string;
  link?: string;
  position?: number;
  rank?: number;
}

async function checkRank(
  keyword: string,
  targetDomain: string | null
): Promise<{ rank: number | null; url: string | null }> {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return { rank: null, url: null };

  const BASE = "https://api.apify.com/v2";
  const actorPath = "apify~google-search-scraper";

  const input = {
    queries: keyword,
    resultsPerPage: 100,
    maxPagesPerQuery: 1,
    languageCode: "en",
    countryCode: "",
  };

  try {
    const res = await fetch(
      `${BASE}/acts/${actorPath}/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(60_000),
      }
    );
    if (!res.ok) return { rank: null, url: null };

    const items = (await res.json().catch(() => [])) as Array<{
      organicResults?: GoogleSearchResult[];
    }>;

    if (!items.length || !items[0]?.organicResults) return { rank: null, url: null };

    const results = items[0].organicResults;

    if (!targetDomain) {
      // No domain to match — return position 1
      const first = results[0];
      return {
        rank: 1,
        url: first?.url ?? first?.link ?? null,
      };
    }

    const domain = targetDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    for (let i = 0; i < results.length; i++) {
      const resultUrl = results[i]?.url ?? results[i]?.link ?? "";
      if (resultUrl.includes(domain)) {
        return { rank: i + 1, url: resultUrl };
      }
    }
    return { rank: null, url: null };
  } catch {
    return { rank: null, url: null };
  }
}

export async function refreshSeoRanks(
  ideaId: string,
  keywordIds?: string[]
): Promise<{ error?: string; updated: number }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error, updated: 0 };

  const { data: allKeywords, error: fetchErr } = await ctx.supabase
    .from("mkt_seo_keyword" as never)
    .select("*")
    .eq("idea_id", ideaId);

  if (fetchErr) return { error: (fetchErr as { message: string }).message, updated: 0 };

  const keywords = (allKeywords as unknown as SeoKeyword[] | null) ?? [];
  const filtered = keywordIds?.length
    ? keywords.filter((k) => keywordIds.includes(k.id))
    : keywords;

  if (!filtered.length) return { updated: 0 };

  let updated = 0;
  const now = new Date().toISOString();

  for (const kw of filtered) {
    const { rank, url } = await checkRank(kw.keyword, kw.target_domain);

    await ctx.supabase
      .from("mkt_seo_keyword" as never)
      .update({ last_rank: rank, last_url: url, last_checked_at: now } as never)
      .eq("id", kw.id);

    await ctx.supabase.from("mkt_seo_rank_history" as never).insert({
      keyword_id: kw.id,
      rank,
      url,
      checked_at: now,
    } as never);

    updated++;
  }

  return { updated };
}

// ── AI keyword suggestions ────────────────────────────────────────────────────

interface SeoSuggestions {
  bofu: string[];
  tofu: string[];
}

export async function suggestSeoKeywords(
  ideaId: string
): Promise<{ error?: string; data?: SeoSuggestions }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { data: valRow } = await ctx.supabase
    .from("mkt_validation" as never)
    .select("positioning, icp_definition")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const val = valRow as {
    positioning: string | null;
    icp_definition: Record<string, string> | null;
  } | null;

  if (!val?.positioning) {
    return { error: "No positioning statement found. Fill in the Positioning page first." };
  }

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const prompt = `You are an SEO strategist. Based on the product positioning and ICP below, suggest 10 search keywords split into:
- BOFU (bottom-of-funnel): high-intent, ready-to-buy searches (5 keywords)
- TOFU (top-of-funnel): educational / problem-aware searches (5 keywords)

Strategic positioning: ${val.positioning}
Brand DNA / ICP: ${val.icp_definition ? JSON.stringify(val.icp_definition) : "(not specified)"}

Return ONLY valid JSON (no markdown):
{
  "bofu": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tofu": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  const res = await generateAiJsonResponse<SeoSuggestions>({
    service: cfg.service,
    apiKey: cfg.apiKey as string,
    model: cfg.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) return { error: res.error ?? "AI generation failed." };
  return { data: res.data };
}
