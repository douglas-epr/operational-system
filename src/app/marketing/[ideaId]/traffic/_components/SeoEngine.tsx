"use client";

import { useState, useTransition } from "react";
import {
  listSeoKeywords,
  addSeoKeyword,
  removeSeoKeyword,
  refreshSeoRanks,
  suggestSeoKeywords,
  type SeoKeyword,
} from "../seo-actions";
import { SparkleIcon, DeleteIcon } from "@/components/ui/icons";

function rankColor(rank: number | null): string {
  if (rank === null) return "text-text-muted";
  if (rank <= 10) return "text-[color:var(--success-strong)]";
  if (rank <= 30) return "text-amber-400";
  return "text-red-400";
}

function rankLabel(rank: number | null): string {
  if (rank === null) return "—";
  return `#${rank}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  ideaId: string;
  initialKeywords: SeoKeyword[];
}

export default function SeoEngine({ ideaId, initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<SeoKeyword[]>(initialKeywords);
  const [newKeyword, setNewKeyword] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const [isSuggesting, startSuggest] = useTransition();
  const [suggestions, setSuggestions] = useState<{
    bofu: string[];
    tofu: string[];
  } | null>(null);

  function reload() {
    start(async () => {
      const r = await listSeoKeywords(ideaId);
      if (r.data) setKeywords(r.data);
    });
  }

  function handleAdd() {
    if (!newKeyword.trim()) return;
    setError(null);
    start(async () => {
      const r = await addSeoKeyword(ideaId, newKeyword.trim(), newDomain.trim() || undefined);
      if (r.error) {
        setError(r.error);
        return;
      }
      setNewKeyword("");
      setNewDomain("");
      reload();
    });
  }

  function handleRemove(id: string) {
    start(async () => {
      await removeSeoKeyword(ideaId, id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    });
  }

  function handleRefresh() {
    setError(null);
    startRefresh(async () => {
      const r = await refreshSeoRanks(ideaId);
      if (r.error) {
        setError(r.error);
        return;
      }
      reload();
    });
  }

  function handleSuggest() {
    setSuggestions(null);
    setError(null);
    startSuggest(async () => {
      const r = await suggestSeoKeywords(ideaId);
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.data) setSuggestions(r.data);
    });
  }

  function addSuggestion(kw: string) {
    setNewKeyword(kw);
    setSuggestions(null);
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-heading-3 text-text-primary">SEO Engine</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Track your Google rank for target keywords over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSuggest}
            disabled={isSuggesting || isPending}
            className="btn btn-tertiary btn-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {isSuggesting ? "Generating…" : "✦ Suggest keywords"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || keywords.length === 0}
            className="btn btn-secondary btn-sm disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing…" : "Refresh ranks"}
          </button>
        </div>
      </div>

      {/* AI suggestions */}
      {suggestions && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
          <p className="text-xs font-medium text-text-primary">
            AI keyword suggestions — click to add
          </p>
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
              Bottom-of-funnel (high intent)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.bofu.map((kw) => (
                <button
                  key={kw}
                  onClick={() => addSuggestion(kw)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mt-2">
              Top-of-funnel (educational)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.tofu.map((kw) => (
                <button
                  key={kw}
                  onClick={() => addSuggestion(kw)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border text-text-secondary hover:bg-muted/40 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add keyword form */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add keyword…"
          className="flex-1 min-w-[160px] px-3 py-1.5 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="Target domain (optional)"
          className="flex-1 min-w-[180px] px-3 py-1.5 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          disabled={!newKeyword.trim() || isPending}
          className="btn btn-secondary btn-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Keyword rank table */}
      {keywords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-[11px] font-medium text-text-muted pr-4">Keyword</th>
                <th className="pb-2 text-[11px] font-medium text-text-muted pr-4">Target domain</th>
                <th className="pb-2 text-[11px] font-medium text-text-muted pr-4 text-right">Rank</th>
                <th className="pb-2 text-[11px] font-medium text-text-muted pr-4">Ranking URL</th>
                <th className="pb-2 text-[11px] font-medium text-text-muted pr-4">Checked</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium text-text-primary text-xs">
                    {kw.keyword}
                  </td>
                  <td className="py-2 pr-4 text-xs text-text-muted">
                    {kw.target_domain ?? <span className="italic">any</span>}
                  </td>
                  <td className={`py-2 pr-4 text-right text-sm font-bold tabular-nums ${rankColor(kw.last_rank)}`}>
                    {rankLabel(kw.last_rank)}
                  </td>
                  <td className="py-2 pr-4 text-xs max-w-[200px] truncate">
                    {kw.last_url ? (
                      <a
                        href={kw.last_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline truncate block"
                        title={kw.last_url}
                      >
                        {kw.last_url.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    ) : (
                      <span className="text-text-muted italic">
                        {kw.last_checked_at ? "not found" : "not checked"}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-xs text-text-muted whitespace-nowrap">
                    {relativeTime(kw.last_checked_at)}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => handleRemove(kw.id)}
                      disabled={isPending}
                      aria-label="Remove keyword"
                      className="p-1 text-text-muted hover:text-red-400 rounded transition-colors"
                    >
                      <DeleteIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-text-muted mt-2">
            Rank color: <span className="text-[color:var(--success-strong)] font-semibold">#1–10 green</span> · <span className="text-amber-400 font-semibold">#11–30 amber</span> · <span className="text-red-400 font-semibold">#31+ red</span> · — not found
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          No keywords tracked yet. Add your first keyword above or use ✦ Suggest keywords.
        </p>
      )}
    </section>
  );
}
