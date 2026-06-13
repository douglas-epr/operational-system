"use client";

/**
 * SignalsTable — lists captured demand signals with search, type filter, CSV
 * export, and a click-to-detail popup showing full signal data + quiz answers.
 */

import { useMemo, useState } from "react";
import type { MktSignal, MktSignalType } from "@/types/marketing";
import EmptyState from "@/components/ui/EmptyState";
import { SearchIcon, DownloadIcon, MegaphoneIcon, CloseIcon } from "@/components/ui/icons";

const TYPE_STYLE: Record<MktSignalType, string> = {
  quiz: "status-ready-qa",
  waitlist: "status-in-progress",
  preorder: "status-done",
};

export default function SignalsTable({ signals }: { signals: MktSignal[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | MktSignalType>("");
  const [selected, setSelected] = useState<MktSignal | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return signals.filter((s) => {
      if (type && s.type !== type) return false;
      if (q) {
        const hay = `${s.email ?? ""} ${s.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [signals, search, type]);

  function exportCsv() {
    const rows = [
      ["type", "email", "name", "quiz_answers", "amount_cents", "created_at"],
      ...filtered.map((s) => [
        s.type,
        s.email ?? "",
        s.name ?? "",
        JSON.stringify(s.quiz_answers ?? {}),
        s.amount_cents != null ? String(s.amount_cents) : "",
        s.created_at,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    // UTF-8 BOM so Excel opens it correctly
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signals-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            strokeWidth={2}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name"
            className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "" | MktSignalType)}
          className="px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">All types</option>
          <option value="quiz">Quiz</option>
          <option value="waitlist">Waitlist</option>
          <option value="preorder">Pre-order</option>
        </select>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="btn btn-secondary btn-sm"
        >
          <DownloadIcon className="w-4 h-4" strokeWidth={2} /> Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon />}
          title="No signals yet"
          body="Publish a landing page and drive traffic to it. Quiz and waitlist submissions will appear here."
        />
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Quiz</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const answerCount = Object.keys(s.quiz_answers ?? {}).length;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="border-b border-border/60 last:border-0 cursor-pointer hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className={`status-badge ${TYPE_STYLE[s.type]}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-text-primary font-mono text-xs">
                      {s.email || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {s.name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {answerCount > 0 ? `${answerCount} answer${answerCount === 1 ? "" : "s"}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <SignalDetailModal signal={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SignalDetailModal({
  signal,
  onClose,
}: {
  signal: MktSignal;
  onClose: () => void;
}) {
  const answers = signal.quiz_answers ?? {};
  const answerEntries = Object.entries(answers);
  const utm = signal.utm ?? {};
  const utmEntries = Object.entries(utm).filter(([, v]) => v != null && v !== "");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 space-y-5 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`status-badge ${TYPE_STYLE[signal.type]} mb-2 inline-block`}>
              {signal.type}
            </span>
            <h2 className="text-heading-3 text-text-primary">
              {signal.name || signal.email || "Signal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded transition-colors shrink-0"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Contact info */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Contact</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <span className="text-text-muted">Email</span>
            <span className="text-text-primary font-mono text-xs break-all">{signal.email || "—"}</span>
            <span className="text-text-muted">Name</span>
            <span className="text-text-primary">{signal.name || "—"}</span>
            <span className="text-text-muted">Submitted</span>
            <span className="text-text-secondary">
              {new Date(signal.created_at).toLocaleString()}
            </span>
            {signal.amount_cents != null && signal.amount_cents > 0 && (
              <>
                <span className="text-text-muted">Amount</span>
                <span className="text-[color:var(--success-strong)] font-semibold">
                  £{(signal.amount_cents / 100).toFixed(2)}
                </span>
              </>
            )}
          </div>
        </section>

        {/* Quiz answers */}
        {answerEntries.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Quiz answers
            </h3>
            <div className="space-y-3">
              {answerEntries.map(([question, answer]) => (
                <div key={question} className="rounded-lg bg-elevated p-3">
                  <p className="text-xs font-medium text-text-secondary mb-1">{question}</p>
                  <p className="text-sm text-text-primary">
                    {typeof answer === "object"
                      ? JSON.stringify(answer)
                      : String(answer)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* UTM / source */}
        {utmEntries.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Traffic source
            </h3>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm">
              {utmEntries.map(([k, v]) => (
                <>
                  <span key={k + "_k"} className="text-text-muted capitalize">{k.replace("utm_", "")}</span>
                  <span key={k + "_v"} className="text-text-secondary truncate">{String(v)}</span>
                </>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
