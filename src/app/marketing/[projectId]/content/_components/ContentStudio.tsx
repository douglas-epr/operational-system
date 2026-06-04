"use client";

/**
 * ContentStudio — Buffer-inspired content calendar with:
 *   - Month calendar grid with drag-and-drop rescheduling
 *   - Full-screen post composer with image upload (drag & drop or click-to-select)
 *   - Live platform preview (LinkedIn, Google Business, generic)
 *   - AI 3-agent drafting pipeline
 *   - Schedule modes: queue / custom time / post now
 *   - Analytics panel: Buffer REST v1 post stats + local DB summary
 */

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MktContent, MktContentStatus } from "@/types/marketing";
import type { BufferChannel } from "@/lib/api/buffer-labels";
import { serviceName } from "@/lib/api/buffer-labels";
import type { ContentAnalytics } from "../actions";
import {
  saveContent,
  rescheduleContent,
  deleteContent,
  generateContentDraft,
  publishNow,
  scheduleWithBuffer,
  uploadMedia,
  fetchAnalytics,
} from "../actions";
import Button from "@/components/ui/Button";
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparkleIcon,
  DeleteIcon,
  CloseIcon,
  ExternalLinkIcon,
  CheckIcon,
} from "@/components/ui/icons";

// ── Platform char limits ──────────────────────────────────────────────────────

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  googlebusiness: 1500,
};

function charLimit(services: string[]): number | null {
  const limits = services
    .map((s) => CHAR_LIMITS[s.toLowerCase()])
    .filter(Boolean) as number[];
  return limits.length ? Math.min(...limits) : null;
}

// ── Status dot ────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<MktContentStatus, string> = {
  draft: "bg-text-muted",
  scheduled: "bg-accent",
  posted: "bg-[color:var(--success-strong)]",
  failed: "bg-red-500",
};

const STATUS_LABEL: Record<MktContentStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  posted: "Posted",
  failed: "Failed",
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function monthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Platform icons (emoji fallbacks) ─────────────────────────────────────────

function ServiceIcon({ service }: { service: string }) {
  const icons: Record<string, string> = {
    linkedin: "in",
    googlebusiness: "G",
    twitter: "𝕏",
    instagram: "IG",
    facebook: "f",
    tiktok: "TT",
    threads: "Th",
    bluesky: "🦋",
  };
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-accent/20 text-accent text-[9px] font-bold shrink-0">
      {icons[service] ?? service.charAt(0).toUpperCase()}
    </span>
  );
}

// ── Platform preview ──────────────────────────────────────────────────────────

function PlatformPreview({
  channel,
  text,
  imageUrl,
}: {
  channel: BufferChannel | null;
  text: string;
  imageUrl: string | null;
}) {
  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
        Select a channel to see preview
      </div>
    );
  }

  const displayText = text || "Write your post to see a preview…";

  return (
    <div className="rounded-xl border border-border bg-elevated p-4 space-y-3">
      {/* Channel header */}
      <div className="flex items-center gap-2">
        {channel.avatar ? (
          <img src={channel.avatar} alt={channel.name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
            {channel.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-text-primary leading-tight">{channel.name}</p>
          <p className="text-xs text-text-muted">{serviceName(channel.service)} · Now</p>
        </div>
      </div>

      {/* Post body */}
      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{displayText}</p>

      {/* Image preview */}
      {imageUrl && (
        <div className="rounded-lg overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Post media" className="w-full max-h-48 object-cover" />
        </div>
      )}

      {/* Platform-specific engagement row */}
      {channel.service === "linkedin" && (
        <div className="flex gap-4 text-xs text-text-muted pt-2 border-t border-border">
          <span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span><span>📤 Send</span>
        </div>
      )}
      {channel.service === "twitter" && (
        <div className="flex gap-4 text-xs text-text-muted pt-2 border-t border-border">
          <span>💬 Reply</span><span>🔁 Retweet</span><span>❤️ Like</span><span>📤 Share</span>
        </div>
      )}
      {(channel.service === "instagram" || channel.service === "facebook") && (
        <div className="flex gap-4 text-xs text-text-muted pt-2 border-t border-border">
          <span>❤️ Like</span><span>💬 Comment</span><span>📤 Share</span>
        </div>
      )}
    </div>
  );
}

// ── Image dropzone ────────────────────────────────────────────────────────────

function ImageDropzone({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadMedia(projectId, fd);
    setUploading(false);
    if (r.error) { setError(r.error); return; }
    if (r.url) onChange(r.url);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  if (value) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Post media" className="w-full max-h-52 object-cover" />
        <button
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 p-1 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors"
          aria-label="Remove image"
        >
          <CloseIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-5 cursor-pointer transition-colors text-center",
          dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-muted/30",
        ].join(" ")}
      >
        <svg className={["w-7 h-7", dragging ? "text-accent" : "text-text-muted"].join(" ")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M13.5 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM3 16.5V18A2.25 2.25 0 0 0 5.25 20.25h13.5A2.25 2.25 0 0 0 21 18v-1.5M4.5 8.25v-.75A2.25 2.25 0 0 1 6.75 5.25h10.5A2.25 2.25 0 0 1 19.5 7.5v.75" />
        </svg>
        <span className="text-sm text-text-muted">
          {uploading ? "Uploading…" : (
            <><span className="text-accent font-medium">Click to upload</span> or drag &amp; drop</>
          )}
        </span>
        <span className="text-xs text-text-muted">PNG, JPG, GIF, WEBP — max 10 MB</span>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({
  projectId,
  channels,
}: {
  projectId: string;
  channels: BufferChannel[];
}) {
  const [data, setData] = useState<ContentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    if (data) { setOpen((v) => !v); return; }
    setLoading(true);
    setOpen(true);
    const result = await fetchAnalytics(projectId);
    setData(result);
    setLoading(false);
  }

  const statusColors: Record<string, string> = {
    draft: "text-text-muted",
    scheduled: "text-accent",
    posted: "text-[color:var(--success-strong)]",
    failed: "text-red-400",
  };

  return (
    <div className="mt-6">
      <button
        onClick={load}
        className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3 hover:text-accent transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
        Analytics
        <svg className={["w-3.5 h-3.5 transition-transform", open ? "rotate-180" : ""].join(" ")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-4">
          {loading && (
            <div className="text-sm text-text-muted py-4 text-center">Loading analytics…</div>
          )}

          {data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["draft","scheduled","posted","failed"] as MktContentStatus[]).map((s) => (
                  <div key={s} className="rounded-xl border border-border bg-elevated px-4 py-3">
                    <p className={["text-2xl font-bold", statusColors[s]].join(" ")}>
                      {data.summaryByStatus[s] ?? 0}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{STATUS_LABEL[s]}</p>
                  </div>
                ))}
              </div>

              {/* Per-profile sent post stats */}
              {data.profiles.length === 0 && (
                <p className="text-sm text-text-muted">No Buffer profiles connected via REST API.</p>
              )}
              {data.profiles.map((profile) => {
                const posts = data.postsByProfile[profile.id] ?? [];
                const ch = channels.find((c) => c.service === profile.service);
                return (
                  <div key={profile.id} className="rounded-xl border border-border bg-elevated overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                      <ServiceIcon service={profile.service} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {profile.service_username || ch?.name || profile.service}
                        </p>
                        <p className="text-xs text-text-muted">{serviceName(profile.service)}</p>
                      </div>
                      {profile.statistics.followers != null && (
                        <span className="ml-auto text-xs text-text-muted shrink-0">
                          {profile.statistics.followers.toLocaleString()} followers
                        </span>
                      )}
                    </div>

                    {posts.length === 0 ? (
                      <p className="text-xs text-text-muted px-4 py-3">No sent posts found.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {posts.slice(0, 5).map((post) => {
                          const s = post.statistics;
                          const engagement = [
                            s.impressions && { label: "Impressions", value: s.impressions },
                            s.reach && { label: "Reach", value: s.reach },
                            s.clicks && { label: "Clicks", value: s.clicks },
                            (s.likes ?? s.favorites) && { label: "Likes", value: s.likes ?? s.favorites },
                            s.comments && { label: "Comments", value: s.comments },
                            s.retweets && { label: "Retweets", value: s.retweets },
                          ].filter(Boolean) as { label: string; value: number }[];

                          return (
                            <div key={post.id} className="px-4 py-3 space-y-2">
                              <p className="text-xs text-text-secondary line-clamp-2">{post.text}</p>
                              {engagement.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                  {engagement.map((e) => (
                                    <div key={e.label} className="text-center">
                                      <p className="text-sm font-bold text-text-primary">{e.value.toLocaleString()}</p>
                                      <p className="text-[10px] text-text-muted">{e.label}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-text-muted">No engagement data available for this platform.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  channels: BufferChannel[];
  channelsError: string | null;
  initialContent: MktContent[];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContentStudio({ projectId, channels, channelsError, initialContent }: Props) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => new Date());
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MktContent | null>(null);
  const [detailPost, setDetailPost] = useState<MktContent | null>(null);

  const today = ymd(new Date());
  const grid = useMemo(() => monthGrid(cursor), [cursor]);

  const byDay = useMemo(() => {
    const m = new Map<string, MktContent[]>();
    for (const c of initialContent) {
      if (!c.scheduled_at) continue;
      const key = ymd(new Date(c.scheduled_at));
      (m.get(key) ?? m.set(key, []).get(key)!).push(c);
    }
    return m;
  }, [initialContent]);

  const drafts = initialContent.filter((c) => !c.scheduled_at || c.status === "draft");

  function openNew(date?: Date) {
    setEditingPost(date ? { scheduled_at: date.toISOString() } as MktContent : null);
    setComposerOpen(true);
  }

  function openEdit(c: MktContent) {
    if (c.status === "posted" || c.status === "failed") {
      setDetailPost(c);
      return;
    }
    setEditingPost(c);
    setComposerOpen(true);
  }

  function onDropToDay(date: Date, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const existing = initialContent.find((c) => c.id === id);
    const t = existing?.scheduled_at ? new Date(existing.scheduled_at) : null;
    const dt = new Date(date);
    dt.setHours(t ? t.getHours() : 9, t ? t.getMinutes() : 0, 0, 0);
    rescheduleContent(projectId, id, dt.toISOString()).then(() => router.refresh());
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded-md hover:bg-muted text-text-secondary transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-4 h-4" strokeWidth={2} />
          </button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded-md hover:bg-muted text-text-secondary transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-2.5 py-1 text-xs rounded-md border border-border text-text-secondary hover:bg-muted transition-colors ml-1"
          >
            Today
          </button>
        </div>
        <Button leadingIcon={<AddIcon className="w-4 h-4" strokeWidth={2} />} onClick={() => openNew()}>
          New post
        </Button>
      </div>

      {/* Channel pills */}
      {channelsError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 mb-4 text-sm text-amber-400/90">
          Couldn&apos;t reach Buffer. Check <code className="text-xs bg-muted px-1 rounded">BUFFER_API_KEY</code>. Error: {channelsError}
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-lg border border-border bg-elevated px-4 py-3 mb-4 text-sm text-text-muted">
          No social channels connected. Connect accounts in your Buffer dashboard.
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-text-muted font-medium">Channels:</span>
          {channels.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 text-xs text-text-secondary border border-border rounded-full px-2.5 py-1 bg-elevated">
              <ServiceIcon service={c.service} />
              <span className="font-medium">{c.name}</span>
              <span className="text-text-muted">· {serviceName(c.service)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-xl overflow-hidden shadow-sm">
        {DOW.map((d) => (
          <div key={d} className="bg-elevated px-2 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide text-center">
            {d}
          </div>
        ))}
        {grid.map((date) => {
          const key = ymd(date);
          const inMonth = date.getMonth() === cursor.getMonth();
          const isPast = key < today;
          const isToday = key === today;
          const posts = byDay.get(key) ?? [];

          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropToDay(date, e)}
              onClick={() => !isPast && openNew(date)}
              className={[
                "bg-base min-h-[100px] p-1.5 transition-colors relative",
                !inMonth ? "opacity-35" : "",
                isPast ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-surface/50",
                isToday ? "bg-accent/5" : "",
              ].join(" ")}
            >
              <div className={[
                "text-[11px] mb-1 text-right pr-0.5 w-6 ml-auto rounded-full flex items-center justify-center",
                isToday ? "bg-accent text-white font-bold w-5 h-5 text-[10px]" : "text-text-muted",
              ].join(" ")}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {posts.slice(0, 3).map((p) => (
                  <PostChip key={p.id} post={p} onClick={(e) => { e.stopPropagation(); openEdit(p); }} />
                ))}
                {posts.length > 3 && (
                  <p className="text-[10px] text-text-muted px-1">+{posts.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drafts tray */}
      {drafts.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            Drafts
            <span className="text-xs text-text-muted font-normal bg-muted px-1.5 py-0.5 rounded-full">
              {drafts.length}
            </span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            {drafts.map((p) => (
              <button
                key={p.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                onClick={() => openEdit(p)}
                className="text-left max-w-[200px] border border-border rounded-xl px-3 py-2 bg-elevated hover:border-accent transition-colors cursor-grab active:cursor-grabbing"
                title="Drag onto a day to schedule"
              >
                {p.media_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media_url} alt="" className="w-full h-16 object-cover rounded-lg mb-2" />
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[p.status]}`} />
                  <span className="text-[10px] text-text-muted">{STATUS_LABEL[p.status]}</span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{p.body || "(empty)"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytics section */}
      <AnalyticsPanel projectId={projectId} channels={channels} />

      {/* Composer */}
      {composerOpen && (
        <PostComposer
          projectId={projectId}
          channels={channels}
          editPost={editingPost?.id ? editingPost : null}
          defaultDate={!editingPost?.id && editingPost?.scheduled_at ? new Date(editingPost.scheduled_at) : undefined}
          onClose={() => { setComposerOpen(false); setEditingPost(null); }}
          onSaved={() => { setComposerOpen(false); setEditingPost(null); router.refresh(); }}
        />
      )}

      {/* Sent/failed detail */}
      {detailPost && (
        <PostDetail post={detailPost} channels={channels} onClose={() => setDetailPost(null)} />
      )}
    </div>
  );
}

// ── PostChip ──────────────────────────────────────────────────────────────────

function PostChip({ post, onClick }: { post: MktContent; onClick: (e: React.MouseEvent) => void }) {
  const time = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      draggable={post.status !== "posted"}
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/plain", post.id); }}
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 bg-elevated border border-border text-[11px] cursor-pointer hover:border-accent transition-colors group"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status]}`} />
      {post.media_url && (
        <svg className="w-2.5 h-2.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 16.5V18A2.25 2.25 0 0 0 5.25 20.25h13.5A2.25 2.25 0 0 0 21 18v-1.5" />
        </svg>
      )}
      {time && <span className="text-text-muted shrink-0">{time}</span>}
      <span className="truncate text-text-secondary">{post.body || "(empty)"}</span>
    </div>
  );
}

// ── Post Detail popup ─────────────────────────────────────────────────────────

function PostDetail({ post, channels, onClose }: { post: MktContent; channels: BufferChannel[]; onClose: () => void }) {
  const ids = (post.external_post_ids ?? {}) as Record<string, unknown>;
  const externalLinks = (ids.external_links ?? {}) as Record<string, string>;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-elevated border border-border rounded-2xl max-w-md w-full p-6 space-y-4 overflow-y-auto max-h-[90vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${
              post.status === "posted"
                ? "bg-[color:var(--success-strong)]/10 text-[color:var(--success-strong)]"
                : "bg-red-500/10 text-red-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[post.status]}`} />
              {post.status === "posted" ? "Posted" : "Failed"}
            </span>
            {post.posted_at && (
              <p className="text-sm text-text-primary font-medium">
                {new Date(post.posted_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors">
            <CloseIcon className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {post.media_url && (
          <div className="rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.media_url} alt="Post media" className="w-full max-h-48 object-cover" />
          </div>
        )}

        <div className="rounded-xl bg-surface border border-border p-3">
          <p className="text-sm text-text-primary whitespace-pre-wrap">{post.body || "(empty)"}</p>
        </div>

        {(post.channels ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Platforms</p>
            {(post.channels ?? []).map((id) => {
              const ch = channels.find((c) => c.id === id);
              const link = externalLinks[id];
              return (
                <div key={id} className="flex items-center justify-between gap-2 rounded-xl bg-surface border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {ch && <ServiceIcon service={ch.service} />}
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{ch?.name ?? id}</p>
                      <p className="text-xs text-text-muted">{ch ? serviceName(ch.service) : "Unknown"}</p>
                    </div>
                  </div>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline shrink-0"
                    >
                      <ExternalLinkIcon className="w-3 h-3" strokeWidth={2} />
                      View post
                    </a>
                  ) : (
                    <span className="text-xs text-text-muted shrink-0">No link</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-text-muted">
          Detailed analytics (impressions, likes) are available in the Analytics section below the calendar.
        </p>
      </div>
    </div>
  );
}

// ── Full-screen Post Composer ─────────────────────────────────────────────────

type ScheduleMode = "now" | "queue" | "custom";

function PostComposer({
  projectId,
  channels,
  editPost,
  defaultDate,
  onClose,
  onSaved,
}: {
  projectId: string;
  channels: BufferChannel[];
  editPost: MktContent | null;
  defaultDate?: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [isPending, start] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const today = ymd(new Date());
  const nowTime = hhmm(new Date());

  const initDate = defaultDate ?? (editPost?.scheduled_at ? new Date(editPost.scheduled_at) : new Date());

  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    editPost?.channels ?? channels.map((c) => c.id)
  );
  const [body, setBody] = useState(editPost?.body ?? "");
  const [mediaUrl, setMediaUrl] = useState<string | null>(editPost?.media_url ?? null);
  const [mode, setMode] = useState<ScheduleMode>(
    editPost?.status === "scheduled" ? "custom" : "queue"
  );
  const [date, setDate] = useState(ymd(initDate));
  const [time, setTime] = useState(
    editPost?.scheduled_at
      ? hhmm(new Date(editPost.scheduled_at))
      : hhmm(new Date(Date.now() + 30 * 60_000))
  );
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const [previewChannel, setPreviewChannel] = useState<string | null>(
    editPost?.channels?.[0] ?? channels[0]?.id ?? null
  );

  const minTime = date === today ? nowTime : undefined;
  const previewCh = channels.find((c) => c.id === previewChannel) ?? null;

  const selectedServices = channels
    .filter((c) => selectedChannels.includes(c.id))
    .map((c) => c.service);
  const limit = charLimit(selectedServices);

  const overLimit = limit !== null && body.length > limit;

  function toggleChannel(id: string) {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setPreviewChannel(id);
  }

  function scheduledIso(): string | null {
    if (!date) return null;
    return new Date(`${date}T${time || "09:00"}`).toISOString();
  }

  async function aiDraft() {
    setAiPending(true);
    setError(null);
    const services = channels.filter((c) => selectedChannels.includes(c.id)).map((c) => c.service);
    const r = await generateContentDraft(projectId, topic, services);
    setAiPending(false);
    if (r.error) setError(r.error);
    else if (r.text) setBody(r.text);
  }

  function saveDraft() {
    setError(null);
    start(async () => {
      const r = await saveContent(projectId, {
        id: editPost?.id,
        channels: selectedChannels,
        body,
        scheduled_at: null,
        status: "draft",
        media_url: mediaUrl,
      });
      if (r.error) { setError(r.error); return; }
      onSaved();
    });
  }

  function doPublishNow() {
    setError(null);
    if (!body.trim()) { setError("Write some content first."); return; }
    if (selectedChannels.length === 0) { setError("Select at least one channel."); return; }
    start(async () => {
      let contentId = editPost?.id;
      if (!contentId) {
        const saved = await saveContent(projectId, {
          channels: selectedChannels, body,
          scheduled_at: new Date().toISOString(),
          status: "draft",
          media_url: mediaUrl,
        });
        if (saved.error) { setError(saved.error); return; }
        contentId = saved.id;
      }
      if (!contentId) { setError("Failed to save."); return; }
      const r = await publishNow(projectId, contentId, selectedChannels);
      if (r.error) { setError(r.error); return; }
      onSaved();
    });
  }

  function doSchedule() {
    setError(null);
    if (!body.trim()) { setError("Write some content first."); return; }
    if (selectedChannels.length === 0) { setError("Select at least one channel."); return; }
    if (mode === "now") { doPublishNow(); return; }

    const iso = scheduledIso();
    if (mode === "custom") {
      if (!iso) { setError("Pick a date/time."); return; }
      if (new Date(iso) <= new Date()) { setError("Schedule time must be in the future."); return; }
    }

    start(async () => {
      let contentId = editPost?.id;
      if (!contentId) {
        const saved = await saveContent(projectId, {
          channels: selectedChannels, body,
          scheduled_at: iso, status: "scheduled",
          media_url: mediaUrl,
        });
        if (saved.error) { setError(saved.error); return; }
        contentId = saved.id;
      }
      if (!contentId) { setError("Failed to save."); return; }

      if (mode === "queue") {
        const r = await saveContent(projectId, {
          id: contentId, channels: selectedChannels, body,
          scheduled_at: iso, status: "scheduled",
          media_url: mediaUrl,
        });
        if (r.error) { setError(r.error); return; }
      } else {
        const r = await scheduleWithBuffer(projectId, contentId, selectedChannels, iso!);
        if (r.error) { setError(r.error); return; }
      }
      onSaved();
    });
  }

  function doDelete() {
    if (!editPost?.id) return onClose();
    start(async () => {
      await deleteContent(projectId, editPost.id);
      onSaved();
    });
  }

  const modeLabel: Record<ScheduleMode, string> = {
    queue: "Schedule",
    now: "Post now",
    custom: "Set time",
  };

  const onImageChange = useCallback((url: string | null) => setMediaUrl(url), []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="w-full max-w-5xl bg-elevated border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text-primary">
            {editPost?.id ? "Edit post" : "Create post"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={[
                "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                showPreview
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-text-secondary hover:bg-muted",
              ].join(" ")}
            >
              {showPreview ? "Hide preview" : "Preview"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={["flex flex-1 min-h-0", showPreview ? "divide-x divide-border" : ""].join(" ")}>

          {/* Left: editor */}
          <div className="flex-1 min-w-0 flex flex-col">

            {/* Channel selector */}
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">Post to</p>
              {channels.length === 0 ? (
                <p className="text-sm text-text-muted">No channels connected in Buffer.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {channels.map((c) => {
                    const on = selectedChannels.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleChannel(c.id)}
                        className={[
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-all",
                          on
                            ? "border-accent bg-accent/10 text-text-primary"
                            : "border-border text-text-secondary hover:border-accent/40",
                        ].join(" ")}
                      >
                        {c.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <ServiceIcon service={c.service} />
                        )}
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-text-muted text-xs hidden sm:inline">· {serviceName(c.service)}</span>
                        {on && <CheckIcon className="w-3.5 h-3.5 text-accent" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI draft bar */}
            <div className="px-5 py-2.5 border-b border-border bg-surface/40">
              <div className="flex items-center gap-2">
                <SparkleIcon className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic or angle for AI draft (optional)"
                  className="flex-1 py-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && aiDraft()}
                />
                <button
                  onClick={aiDraft}
                  disabled={aiPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50"
                >
                  {aiPending ? "Drafting…" : "✦ Draft"}
                </button>
              </div>
            </div>

            {/* Text editor */}
            <div className="flex-1 px-5 py-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your post…"
                className="w-full h-full min-h-[140px] bg-transparent text-text-primary text-sm leading-relaxed placeholder:text-text-muted focus:outline-none resize-none"
                autoFocus
              />
            </div>

            {/* Image upload */}
            <div className="px-5 pb-4">
              <ImageDropzone
                projectId={projectId}
                value={mediaUrl}
                onChange={onImageChange}
              />
            </div>

            {/* Custom date/time */}
            {mode === "custom" && (
              <div className="px-5 pb-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => {
                      const nd = e.target.value;
                      let nt = time;
                      if (nd === today) {
                        const [h, m] = time.split(":").map(Number);
                        const now = new Date();
                        const sel = new Date();
                        sel.setHours(h, m, 0, 0);
                        if (sel <= now) nt = hhmm(new Date(Date.now() + 30 * 60_000));
                      }
                      setDate(nd);
                      setTime(nt);
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    min={minTime}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {error && <p className="px-5 pb-3 text-sm text-red-400">{error}</p>}

            {/* Bottom bar */}
            <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {editPost?.id && (
                  <button
                    onClick={doDelete}
                    disabled={isPending}
                    className="p-1.5 text-text-muted hover:text-red-400 rounded-lg transition-colors"
                    aria-label="Delete post"
                  >
                    <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                )}
                <span className={["text-xs", overLimit ? "text-red-400 font-semibold" : "text-text-muted"].join(" ")}>
                  {body.length}{limit !== null ? ` / ${limit}` : ""} chars
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveDraft}
                  disabled={isPending}
                  className="text-sm px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Save draft
                </button>

                {/* Split schedule button */}
                <div className="relative">
                  <div className="flex rounded-lg overflow-hidden border border-accent">
                    <button
                      onClick={doSchedule}
                      disabled={isPending || overLimit}
                      className="px-4 py-2 bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {isPending ? "Posting…" : modeLabel[mode]}
                    </button>
                    <button
                      onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                      className="px-2 py-2 bg-accent text-white border-l border-white/20 hover:bg-accent/90 transition-colors"
                      aria-label="Scheduling options"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {showScheduleDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowScheduleDropdown(false)} />
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden z-20">
                        {([
                          { key: "queue", label: "Schedule", desc: "Add to Buffer queue" },
                          { key: "custom", label: "Set date & time", desc: "Choose a specific slot" },
                          { key: "now", label: "Post now", desc: "Publish immediately" },
                        ] as { key: ScheduleMode; label: string; desc: string }[]).map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => { setMode(opt.key); setShowScheduleDropdown(false); }}
                            className={[
                              "w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors",
                              mode === opt.key ? "text-accent" : "text-text-primary",
                            ].join(" ")}
                          >
                            <span className="flex items-center gap-2 font-medium">
                              {mode === opt.key
                                ? <CheckIcon className="w-3.5 h-3.5 text-accent" strokeWidth={3} />
                                : <span className="w-3.5" />
                              }
                              {opt.label}
                            </span>
                            <span className="text-xs text-text-muted mt-0.5 ml-5 block">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: platform preview */}
          {showPreview && (
            <div className="w-72 shrink-0 flex flex-col bg-base/60">
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">Preview</p>
                {channels.filter((c) => selectedChannels.includes(c.id)).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {channels.filter((c) => selectedChannels.includes(c.id)).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setPreviewChannel(c.id)}
                        className={[
                          "text-xs px-2 py-1 rounded-full border transition-colors",
                          previewChannel === c.id
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-text-muted hover:text-text-primary",
                        ].join(" ")}
                      >
                        {serviceName(c.service)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <PlatformPreview channel={previewCh} text={body} imageUrl={mediaUrl} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
