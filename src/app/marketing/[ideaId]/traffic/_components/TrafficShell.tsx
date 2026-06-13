"use client";

/**
 * TrafficShell — paid-traffic campaign manager.
 * Create a campaign → copy its locked-UTM ad URL into Meta/Google/LinkedIn Ads
 * Manager → enter spend manually → attribution (sessions, captures, cost per
 * verified ICP capture) joins automatically on utm_campaign.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MktAdPlatform, MktAdStatus } from "@/types/marketing";
import { AD_PLATFORM_LABELS } from "@/types/marketing";
import {
  saveAdCampaign,
  deleteAdCampaign,
  generateAdCreative,
  type AdCampaignWithMetrics,
} from "../actions";
import Button from "@/components/ui/Button";
import { AddIcon, DeleteIcon, LinkIcon, SparkleIcon } from "@/components/ui/icons";

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

const STATUS_OPTIONS: MktAdStatus[] = ["draft", "live", "paused", "ended"];

interface AdVariant {
  angle: string;
  primary_text: string;
  headline: string;
  description: string;
  visual_direction: string;
}

export default function TrafficShell({
  ideaId,
  initialCampaigns,
  landingSlug,
}: {
  ideaId: string;
  initialCampaigns: AdCampaignWithMetrics[];
  landingSlug: string | null;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(initialCampaigns.length === 0);
  const [platform, setPlatform] = useState<MktAdPlatform>("meta");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("300");
  const [targeting, setTargeting] = useState("");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  function adUrl(c: AdCampaignWithMetrics): string | null {
    if (!landingSlug) return null;
    return `${appUrl}/m/${landingSlug}?utm_source=${c.platform}&utm_medium=paid&utm_campaign=${c.utm_campaign}`;
  }

  function create() {
    setError(null);
    start(async () => {
      const r = await saveAdCampaign(ideaId, {
        platform,
        name,
        budget_cents: Math.round(Number(budget || "0") * 100),
        targeting_notes: targeting,
      });
      if (r.error) { setError(r.error); return; }
      setName("");
      setTargeting("");
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {!landingSlug && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/90">
          Publish a landing page first — ad URLs point paid traffic at /m/&lt;slug&gt;.
        </div>
      )}

      {/* Create */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary">Campaigns</h2>
            <p className="text-xs text-text-muted mt-1">
              $300–500 of ICP-targeted traffic per idea buys the ~300+ sessions the
              funnel needs for decision-grade data. Attribution is automatic via UTM.
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn btn-secondary btn-sm shrink-0">
            <AddIcon className="w-3.5 h-3.5" strokeWidth={2} /> New campaign
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-border bg-elevated p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_110px] gap-3">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as MktAdPlatform)}
                className={inputCls}
              >
                {(Object.keys(AD_PLATFORM_LABELS) as MktAdPlatform[]).map((p) => (
                  <option key={p} value={p}>{AD_PLATFORM_LABELS[p]}</option>
                ))}
              </select>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Campaign name (e.g. Anxiety angle — US)"
              />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={inputCls}
                placeholder="Budget $"
                title="Budget (USD)"
              />
            </div>
            <textarea
              value={targeting}
              onChange={(e) => setTargeting(e.target.value)}
              rows={2}
              className={inputCls + " resize-none"}
              placeholder="ICP targeting notes — audiences, interests, job titles you'll set in Ads Manager. Also feeds the AI ad copy."
            />
            <div className="flex justify-end">
              <Button onClick={create} loading={isPending}>Create campaign</Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      {/* Campaign list */}
      {initialCampaigns.map((c) => (
        <CampaignCard key={c.id} ideaId={ideaId} campaign={c} adUrl={adUrl(c)} />
      ))}

      {initialCampaigns.length === 0 && !showForm && (
        <p className="text-sm text-text-muted text-center py-8">
          No campaigns yet. Create one to get a trackable ad URL.
        </p>
      )}
    </div>
  );
}

function CampaignCard({
  ideaId,
  campaign: c,
  adUrl,
}: {
  ideaId: string;
  campaign: AdCampaignWithMetrics;
  adUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spend, setSpend] = useState((c.spend_cents / 100).toFixed(0));
  const [copied, setCopied] = useState(false);

  const m = c.metrics;
  const spendUsd = c.spend_cents / 100;
  const costPerSession = m.sessions > 0 ? spendUsd / m.sessions : null;
  const costPerVerified =
    m.verifiedCaptures > 0
      ? spendUsd / m.verifiedCaptures
      : m.captures > 0
      ? spendUsd / m.captures
      : null;

  const creative = (c.ad_creative ?? {}) as { variants?: AdVariant[]; targeting_tips?: string };

  function patch(input: { status?: MktAdStatus; spend_cents?: number }) {
    setError(null);
    start(async () => {
      const r = await saveAdCampaign(ideaId, {
        id: c.id,
        platform: c.platform,
        name: c.name,
        targeting_notes: c.targeting_notes,
        ...input,
      });
      if (r.error) { setError(r.error); return; }
      router.refresh();
    });
  }

  async function genCreative() {
    setError(null);
    setAiPending(true);
    const r = await generateAdCreative(ideaId, c.id);
    setAiPending(false);
    if (r.error) { setError(r.error); return; }
    router.refresh();
  }

  function remove() {
    if (!confirm(`Delete campaign "${c.name}"? Attributed events stay.`)) return;
    start(async () => {
      await deleteAdCampaign(ideaId, c.id);
      router.refresh();
    });
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{c.name}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {AD_PLATFORM_LABELS[c.platform]} · budget ${(c.budget_cents / 100).toFixed(0)} ·{" "}
            <span className="font-mono">{c.utm_campaign}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={c.status}
            onChange={(e) => patch({ status: e.target.value as MktAdStatus })}
            disabled={isPending}
            className="px-2 py-1 bg-elevated border border-border rounded-md text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={remove}
            aria-label="Delete campaign"
            className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors"
          >
            <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Locked ad URL */}
      {adUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2">
          <p className="flex-1 text-xs font-mono text-text-secondary truncate" title={adUrl}>
            {adUrl}
          </p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(adUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn btn-tertiary btn-sm shrink-0"
          >
            <LinkIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {copied ? "Copied" : "Copy ad URL"}
          </button>
        </div>
      )}

      {/* Metrics + manual spend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <p className="text-[10px] text-text-muted">Sessions</p>
          <p className="text-base font-bold text-text-primary">{m.sessions}</p>
        </div>
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <p className="text-[10px] text-text-muted">Captures (ICP)</p>
          <p className="text-base font-bold text-text-primary">
            {m.captures}
            <span className="text-xs font-normal text-text-muted"> ({m.icpCaptures})</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <p className="text-[10px] text-text-muted">Cost / session</p>
          <p className="text-base font-bold text-text-primary">
            {costPerSession !== null ? `$${costPerSession.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <p className="text-[10px] text-text-muted">Cost / capture</p>
          <p className="text-base font-bold text-text-primary">
            {costPerVerified !== null ? `$${costPerVerified.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-elevated px-3 py-2">
          <p className="text-[10px] text-text-muted">Spend (USD)</p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              onBlur={() => patch({ spend_cents: Math.round(Number(spend || "0") * 100) })}
              className="w-full bg-transparent text-base font-bold text-text-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* AI ad creative */}
      <div className="space-y-3">
        <button
          onClick={genCreative}
          disabled={aiPending || isPending}
          className="btn btn-secondary btn-sm"
        >
          <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
          {aiPending ? "Writing ad copy…" : creative.variants?.length ? "Regenerate ad copy" : "Generate ad copy"}
        </button>

        {(creative.variants ?? []).map((v, i) => (
          <div key={i} className="rounded-lg border border-border bg-elevated p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              {v.angle} angle
            </p>
            <p className="text-sm text-text-primary">{v.primary_text}</p>
            <p className="text-xs text-text-secondary">
              <span className="font-semibold">{v.headline}</span>
              {v.description ? ` — ${v.description}` : ""}
            </p>
            <p className="text-[11px] text-text-muted italic">Visual: {v.visual_direction}</p>
          </div>
        ))}
        {creative.targeting_tips && (
          <p className="text-[11px] text-text-muted">{creative.targeting_tips}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
