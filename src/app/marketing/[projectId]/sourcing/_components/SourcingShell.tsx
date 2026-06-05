"use client";

/**
 * SourcingShell — start a Google Maps, B2B people, or Social Discovery sourcing run.
 * Apify scrapes asynchronously; the cron (or the Sync button) imports results.
 * AI fill buttons pre-populate each form from project idea / ICP / positioning data.
 * Clicking a run card opens a modal showing prospects imported from that run.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MktSourceRun, MktProspect } from "@/types/marketing";
import {
  startGoogleMapsSourcing,
  startLeadsSourcing,
  syncSourcingRun,
  startSocialDiscovery,
  aiFillSourcingForm,
  getProspectsForRun,
  deleteProspectFromRun,
} from "../actions";
import type { SocialDiscoveryParams } from "../actions";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SearchIcon, GlobeIcon, UsersIcon, SparkleIcon, DeleteIcon, CloseIcon } from "@/components/ui/icons";

type SocialPlatform = SocialDiscoveryParams["platforms"][number];
type DiscoveryMode  = SocialDiscoveryParams["discoveryMode"];

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "linkedin",  label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook",  label: "Facebook" },
  { id: "youtube",   label: "YouTube" },
  { id: "twitter",   label: "Twitter / X" },
  { id: "tiktok",    label: "TikTok" },
];

const SOCIAL_STAGE_LABELS: Record<string, string> = {
  "0_and_1": "Stage 1/3 — Discovering profiles",
  "2":       "Stage 2/3 — Enriching LinkedIn",
  "3":       "Stage 3/3 — Extracting website emails",
  "done":    "Done",
};

const SENIORITY_OPTIONS = [
  { value: "", label: "Any seniority" },
  { value: "founder", label: "Founder" },
  { value: "owner", label: "Owner" },
  { value: "c_suite", label: "C-Suite" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "head", label: "Head" },
  { value: "manager", label: "Manager" },
];

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

const STATUS_STYLE: Record<string, string> = {
  running: "status-in-progress",
  done: "status-done",
  failed: "status-blocked",
  pending: "status-not-started",
};

export default function SourcingShell({
  projectId,
  initialRuns,
}: {
  projectId: string;
  initialRuns: MktSourceRun[];
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  // ── Google Maps form ──────────────────────────────────────────────────────
  const [terms, setTerms]           = useState("");
  const [location, setLocation]     = useState("");
  const [maxResults, setMaxResults] = useState(25);
  const [scrapeContacts, setScrapeContacts] = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [msg, setMsg]               = useState<string | null>(null);
  const [gMapsAiFilling, setGMapsAiFilling] = useState(false);

  // ── People search form ────────────────────────────────────────────────────
  const [jobTitles, setJobTitles]       = useState("");
  const [keywords, setKeywords]         = useState("");
  const [peopleLocation, setPeopleLocation] = useState("");
  const [seniority, setSeniority]       = useState("");
  const [peopleMax, setPeopleMax]       = useState(25);
  const [peopleError, setPeopleError]   = useState<string | null>(null);
  const [peopleMsg, setPeopleMsg]       = useState<string | null>(null);
  const [peopleAiFilling, setPeopleAiFilling] = useState(false);

  // ── Social Discovery form ─────────────────────────────────────────────────
  const [sdPlatforms, setSdPlatforms] = useState<SocialPlatform[]>(["linkedin", "instagram", "tiktok"]);
  const [sdMode, setSdMode]           = useState<DiscoveryMode>("both");
  const [sdKeywords, setSdKeywords]   = useState("");
  const [sdLocation, setSdLocation]   = useState("");
  const [sdMax, setSdMax]             = useState(25);
  const [sdError, setSdError]         = useState<string | null>(null);
  const [sdMsg, setSdMsg]             = useState<string | null>(null);
  const [socialAiFilling, setSocialAiFilling] = useState(false);

  // ── Run prospects modal ───────────────────────────────────────────────────
  const [modalRun, setModalRun]             = useState<MktSourceRun | null>(null);
  const [modalProspects, setModalProspects] = useState<MktProspect[]>([]);
  const [modalLoading, setModalLoading]     = useState(false);
  const [modalDeleting, setModalDeleting]   = useState<string | null>(null);

  function togglePlatform(p: SocialPlatform) {
    setSdPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  // ── AI fill handlers ──────────────────────────────────────────────────────

  async function aiFillGoogleMaps() {
    setGMapsAiFilling(true);
    try {
      const r = await aiFillSourcingForm(projectId, "google_maps");
      if (r.error) { setError(r.error); return; }
      const d = r.data as { searchTerms?: string[]; location?: string };
      if (d.searchTerms?.length) setTerms(d.searchTerms.join(", "));
      if (d.location) setLocation(d.location);
    } finally {
      setGMapsAiFilling(false);
    }
  }

  async function aiFillPeople() {
    setPeopleAiFilling(true);
    try {
      const r = await aiFillSourcingForm(projectId, "people");
      if (r.error) { setPeopleError(r.error); return; }
      const d = r.data as { jobTitles?: string[]; companyKeywords?: string[]; location?: string; seniority?: string };
      if (d.jobTitles?.length)      setJobTitles(d.jobTitles.join(", "));
      if (d.companyKeywords?.length) setKeywords(d.companyKeywords.join(", "));
      if (d.location)               setPeopleLocation(d.location);
      if (d.seniority)              setSeniority(d.seniority);
    } finally {
      setPeopleAiFilling(false);
    }
  }

  async function aiFillSocial() {
    setSocialAiFilling(true);
    try {
      const r = await aiFillSourcingForm(projectId, "social_discovery");
      if (r.error) { setSdError(r.error); return; }
      const d = r.data as { platforms?: SocialPlatform[]; discoveryMode?: DiscoveryMode; keywords?: string[]; location?: string };
      if (d.platforms?.length) setSdPlatforms(d.platforms);
      if (d.discoveryMode)     setSdMode(d.discoveryMode);
      if (d.keywords?.length)  setSdKeywords(d.keywords.join("\n"));
      if (d.location)          setSdLocation(d.location);
    } finally {
      setSocialAiFilling(false);
    }
  }

  // ── Run modal ─────────────────────────────────────────────────────────────

  async function openRunModal(run: MktSourceRun) {
    setModalRun(run);
    setModalProspects([]);
    setModalLoading(true);
    const r = await getProspectsForRun(projectId, run.id);
    setModalProspects(r.data ?? []);
    setModalLoading(false);
  }

  function closeModal() {
    setModalRun(null);
    setModalProspects([]);
  }

  async function deleteFromModal(prospectId: string) {
    setModalDeleting(prospectId);
    await deleteProspectFromRun(projectId, prospectId);
    setModalProspects((prev) => prev.filter((p) => p.id !== prospectId));
    setModalDeleting(null);
    router.refresh();
  }

  // ── Run actions ───────────────────────────────────────────────────────────

  function startSocialRun() {
    setSdError(null);
    setSdMsg(null);
    start(async () => {
      const kws = sdKeywords.split(/[\n,]/).map((k) => k.trim()).filter(Boolean);
      const r = await startSocialDiscovery(projectId, {
        keywords: kws,
        location: sdLocation.trim(),
        platforms: sdPlatforms,
        discoveryMode: sdMode,
        maxPerPlatform: sdMax,
      });
      if (r.error) setSdError(r.error);
      else {
        setSdMsg("Social discovery started — profiles import automatically as each stage completes.");
        setSdKeywords("");
      }
      router.refresh();
    });
  }

  function startPeopleRun() {
    setPeopleError(null);
    setPeopleMsg(null);
    start(async () => {
      const r = await startLeadsSourcing(projectId, {
        jobTitles: jobTitles.split(",").map((t) => t.trim()).filter(Boolean),
        keywords: keywords.split(",").map((t) => t.trim()).filter(Boolean),
        locations: peopleLocation.split(",").map((t) => t.trim()).filter(Boolean),
        seniority: seniority ? [seniority] : [],
        maxResults: peopleMax,
      });
      if (r.error) setPeopleError(r.error);
      else {
        setPeopleMsg("People search started. Results import when it finishes (or hit Sync).");
        setJobTitles("");
        setKeywords("");
      }
      router.refresh();
    });
  }

  function startRun() {
    setError(null);
    setMsg(null);
    const searchTerms = terms.split(",").map((t) => t.trim()).filter(Boolean);
    start(async () => {
      const r = await startGoogleMapsSourcing(projectId, {
        searchTerms,
        location,
        maxResults,
        scrapeContacts,
        onlyWithWebsite: scrapeContacts,
      });
      if (r.error) setError(r.error);
      else {
        setMsg("Sourcing run started. Results import automatically when it finishes (or hit Sync).");
        setTerms("");
      }
      router.refresh();
    });
  }

  function sync(id: string) {
    start(async () => {
      const r = await syncSourcingRun(projectId, id);
      if (r.error) setError(r.error);
      else setMsg(`Run ${r.status}${r.inserted ? ` — imported ${r.inserted} new prospects` : ""}.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">

        {/* ── Left column: forms ───────────────────────────────────────────── */}
        <section className="space-y-8">

          {/* Google Maps */}
          <div>
            <h2 className="text-heading-3 text-text-primary mb-3 flex items-center gap-2">
              <GlobeIcon className="w-4 h-4 text-text-muted" strokeWidth={2} /> Google Maps
              <button
                onClick={aiFillGoogleMaps}
                disabled={gMapsAiFilling}
                className="ml-auto btn btn-tertiary btn-sm flex items-center gap-1"
                title="AI-fill from project context"
              >
                <SparkleIcon className="w-3 h-3" strokeWidth={2} />
                {gMapsAiFilling ? "Filling…" : "AI fill"}
              </button>
            </h2>
            <div className="card space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Search terms <span className="text-text-muted font-normal">(comma-separated)</span>
                </label>
                <input
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="accountant, bookkeeping firm"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Newcastle, UK"
                  className={inputCls}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-text-secondary flex items-center gap-2">
                  Max
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value || "25", 10))}
                    className="w-20 px-2 py-1 bg-elevated border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scrapeContacts}
                    onChange={(e) => setScrapeContacts(e.target.checked)}
                    className="w-4 h-4 accent-[color:var(--accent)]"
                  />
                  Enrich emails + socials
                </label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {msg   && <p className="text-sm text-text-muted">{msg}</p>}
              <div className="flex justify-end">
                <Button
                  onClick={startRun}
                  loading={isPending}
                  leadingIcon={<SearchIcon className="w-4 h-4" strokeWidth={2} />}
                >
                  Start sourcing
                </Button>
              </div>
              <p className="text-[11px] text-text-muted">
                Imported prospects appear in{" "}
                <Link href={`/marketing/${projectId}/outreach`} className="text-accent">
                  Outreach → Prospects
                </Link>{" "}
                and can be enrolled into a campaign.
              </p>
            </div>
          </div>

          {/* People search */}
          <div>
            <h2 className="text-heading-3 text-text-primary mb-3 flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-text-muted" strokeWidth={2} /> People search
              <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1 py-0.5 text-text-muted">B2B</span>
              <button
                onClick={aiFillPeople}
                disabled={peopleAiFilling}
                className="ml-auto btn btn-tertiary btn-sm flex items-center gap-1"
                title="AI-fill from project context"
              >
                <SparkleIcon className="w-3 h-3" strokeWidth={2} />
                {peopleAiFilling ? "Filling…" : "AI fill"}
              </button>
            </h2>
            <div className="card space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Job titles <span className="text-text-muted font-normal">(comma-separated)</span>
                </label>
                <input
                  value={jobTitles}
                  onChange={(e) => setJobTitles(e.target.value)}
                  placeholder="founder, head of marketing"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Company keywords <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="habit tracking, wellness app"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Location <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    value={peopleLocation}
                    onChange={(e) => setPeopleLocation(e.target.value)}
                    placeholder="united kingdom"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Seniority</label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className={inputCls}
                  >
                    {SENIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary flex items-center gap-2">
                  Max
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={peopleMax}
                    onChange={(e) => setPeopleMax(parseInt(e.target.value || "25", 10))}
                    className="w-20 px-2 py-1 bg-elevated border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </label>
                <span className="text-[11px] text-text-muted">verified emails + LinkedIn · ~$1/1k</span>
              </div>
              {peopleError && <p className="text-sm text-red-400">{peopleError}</p>}
              {peopleMsg   && <p className="text-sm text-text-muted">{peopleMsg}</p>}
              <div className="flex justify-end">
                <Button
                  onClick={startPeopleRun}
                  loading={isPending}
                  leadingIcon={<UsersIcon className="w-4 h-4" strokeWidth={2} />}
                >
                  Find people
                </Button>
              </div>
              <p className="text-[11px] text-text-muted">
                Searches a 250M+ B2B contact database (Apollo-style) directly on Apify —
                no Apollo subscription needed. Imported people appear in Outreach → Prospects.
              </p>
            </div>
          </div>
        </section>

        {/* ── Right column: recent runs ─────────────────────────────────────── */}
        <section>
          <h2 className="text-heading-3 text-text-primary mb-3">Recent runs</h2>
          <p className="text-xs text-text-muted mb-3">Click a run to see its imported prospects.</p>
          {initialRuns.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<SearchIcon />}
              title="No sourcing runs yet"
              body="Start a Google Maps search to pull local businesses into your prospect list."
            />
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border/60">
              {initialRuns.map((run) => {
                const q = run.query as {
                  type?: string;
                  stage?: string;
                  searchStringsArray?: string[];
                  locationQuery?: string;
                  contact_job_title?: string[];
                  contact_location?: string[];
                  params?: { keywords?: string[]; location?: string; platforms?: string[] };
                };
                const isSocial = run.channel === "social_discovery";
                const isPeople = !isSocial && run.channel !== "google_maps";

                let primaryText = "—";
                let secondaryText = "";

                if (isSocial) {
                  const kws = (q.params?.keywords ?? []).slice(0, 3).join(", ");
                  primaryText = kws || "Social discovery";
                  const plat = (q.params?.platforms ?? []).join(", ");
                  const stageLabel = q.stage ? SOCIAL_STAGE_LABELS[q.stage] ?? q.stage : "";
                  secondaryText = [plat, stageLabel, run.result_count ? `${run.result_count} imported` : ""].filter(Boolean).join(" · ");
                } else if (isPeople) {
                  primaryText = (q.contact_job_title ?? []).join(", ") || "—";
                  secondaryText = [(q.contact_location ?? []).join(", "), run.result_count ? `${run.result_count} imported` : ""].filter(Boolean).join(" · ");
                } else {
                  primaryText = (q.searchStringsArray ?? []).join(", ") || "—";
                  secondaryText = [q.locationQuery ?? "", run.result_count ? `${run.result_count} imported` : ""].filter(Boolean).join(" · ");
                }

                return (
                  <div
                    key={run.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => openRunModal(run)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">
                        {primaryText}
                        {isSocial && (
                          <span className="text-[10px] uppercase tracking-wide rounded bg-accent/10 px-1 py-0.5 text-accent ml-1.5">social</span>
                        )}
                        {isPeople && (
                          <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1 py-0.5 text-text-muted ml-1.5">people</span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted truncate">{secondaryText}</p>
                    </div>
                    <span className={`status-badge ${STATUS_STYLE[run.status] ?? ""} shrink-0`}>
                      {run.status}
                    </span>
                    {run.status === "running" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); sync(run.id); }}
                        disabled={isPending}
                        className="text-xs text-accent hover:underline shrink-0"
                      >
                        Sync
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Social Discovery ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-heading-3 text-text-primary mb-3 flex items-center gap-2">
          <SparkleIcon className="w-4 h-4 text-accent" strokeWidth={1.5} /> Social Discovery
          <span className="text-[10px] uppercase tracking-wide rounded bg-accent/10 px-1 py-0.5 text-accent">Multi-platform</span>
          <button
            onClick={aiFillSocial}
            disabled={socialAiFilling}
            className="ml-auto btn btn-tertiary btn-sm flex items-center gap-1"
            title="AI-fill from project context"
          >
            <SparkleIcon className="w-3 h-3" strokeWidth={2} />
            {socialAiFilling ? "Filling…" : "AI fill"}
          </button>
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Find creators by keyword match on posts and bios across 6 platforms, then auto-extract their
          emails via a 3-stage pipeline. Seed with your{" "}
          <Link href={`/marketing/${projectId}/positioning`} className="text-accent">
            Reference Sources
          </Link>{" "}
          for higher accuracy.
        </p>
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Platforms</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={sdPlatforms.includes(p.id)}
                    onChange={() => togglePlatform(p.id)}
                    className="w-4 h-4 accent-[color:var(--accent)]"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Discovery mode
              <span className="ml-1.5 text-[11px] font-normal text-text-muted">
                — Bio searches profile descriptions; Posts finds active posters
              </span>
            </label>
            <div className="flex gap-2">
              {(["bio", "content", "both"] as DiscoveryMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSdMode(m)}
                  className={[
                    "px-3 py-1.5 text-xs rounded-md border transition-colors",
                    sdMode === m
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-muted hover:border-accent/40",
                  ].join(" ")}
                >
                  {m === "bio" ? "Bio / Profile" : m === "content" ? "Posts / Content" : "Both (recommended)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Keywords <span className="text-text-muted font-normal">(comma or newline separated)</span>
              </label>
              <textarea
                value={sdKeywords}
                onChange={(e) => setSdKeywords(e.target.value)}
                rows={3}
                className={inputCls + " resize-none"}
                placeholder={"fitness coach\npersonal trainer\nnutrition coach"}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Location
                  <span className="ml-1.5 text-[11px] font-normal text-text-muted">
                    native on LinkedIn + Facebook; injected into keywords elsewhere
                  </span>
                </label>
                <input
                  value={sdLocation}
                  onChange={(e) => setSdLocation(e.target.value)}
                  placeholder="London"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Max per platform</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={sdMax}
                    onChange={(e) => setSdMax(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[color:var(--accent)]"
                  />
                  <span className="text-sm text-text-secondary w-10 text-right">{sdMax}</span>
                </div>
              </div>
            </div>
          </div>

          {sdError && <p className="text-sm text-red-400">{sdError}</p>}
          {sdMsg   && <p className="text-sm text-text-muted">{sdMsg}</p>}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-[11px] text-text-muted">
              Email find rates: LinkedIn 20–35% · TikTok 30–50% · Facebook pages 40–60% ·
              Twitter 15–25% · YouTube 5–15% · Instagram 3–20%. Websites 50–80% if bio link exists.
            </p>
            <Button
              onClick={startSocialRun}
              loading={isPending}
              disabled={sdPlatforms.length === 0}
              leadingIcon={<SparkleIcon className="w-4 h-4" strokeWidth={2} />}
            >
              Start social discovery
            </Button>
          </div>
        </div>
      </section>

      {/* ── Run prospects modal ────────────────────────────────────────────────── */}
      {modalRun && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  Prospects from this run
                </p>
                <p className="text-xs text-text-muted truncate">
                  {modalRun.channel} · {new Date(modalRun.created_at).toLocaleDateString()}
                  {!modalLoading && ` · ${modalProspects.length} prospect${modalProspects.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors shrink-0"
                aria-label="Close"
              >
                <CloseIcon className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-text-muted">
                  Loading prospects…
                </div>
              ) : modalProspects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                  <p className="text-sm text-text-muted">No prospects linked to this run.</p>
                  <p className="text-xs text-text-muted">
                    Only runs that completed after today&apos;s update link prospects. Historical runs show empty here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {modalProspects.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary truncate">{p.name || p.email || "—"}</p>
                        <p className="text-xs text-text-muted truncate">
                          {p.email}{p.company ? ` · ${p.company}` : ""}{p.title ? ` · ${p.title}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteFromModal(p.id)}
                        disabled={modalDeleting === p.id}
                        aria-label="Delete prospect"
                        className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors shrink-0 disabled:opacity-40"
                      >
                        <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
