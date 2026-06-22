"use client";

/**
 * TeamWorkloadChart — "% of hours per project, per team member, per month".
 *
 * Renders one 100%-stacked horizontal bar per team member for the selected
 * month: each colored segment is a project (or internal project), its width
 * the share of that member's logged hours that went to it. A month selector
 * scrubs across the loaded window; a shared legend keeps project colors stable
 * across members within a month.
 *
 * Data comes pre-aggregated from the `dashboard_member_project_hours` Supabase
 * view (see _lib/queries.ts) — this component only derives per-month/per-member
 * percentages and assigns colors. No charting lib needed: the segments are
 * plain flex divs, matching the dashboard's hand-rolled bar style.
 */

import { useMemo, useState } from "react";
import type { MemberProjectHoursRow } from "../_lib/queries";

interface Props {
  rows: MemberProjectHoursRow[];
}

/** Stable, dark-theme-friendly palette. Projects are colored by index. */
const PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4",
  "#a855f7", "#ef4444", "#84cc16", "#14b8a6", "#f97316",
  "#3b82f6", "#eab308", "#8b5cf6", "#10b981", "#f43f5e",
];

interface Segment {
  projectId: string;
  projectName: string;
  kind: "project" | "internal";
  hours: number;
  pct: number;
  color: string;
}

interface MemberWorkload {
  memberId: string;
  memberName: string;
  totalHours: number;
  /** Projects with logged hours, sorted desc — drives the stacked bar. */
  segments: Segment[];
  /** Feedback entries logged this month whose total_time was left blank. */
  entriesWithoutHours: number;
}

function monthLabel(key: string): string {
  const [yr, mo] = key.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function TeamWorkloadChart({ rows }: Props) {
  // All months present in the data, newest first.
  const months = useMemo(() => {
    const set = new Set(rows.map((r) => r.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] ?? "");

  // Stable color per project across the whole dataset (so a project keeps its
  // color as you scrub months). Keyed by `${kind}:${id}` to avoid name clashes.
  const colorByKey = useMemo(() => {
    const keys = Array.from(
      new Set(rows.map((r) => `${r.project_kind}:${r.project_id}`))
    ).sort();
    const map = new Map<string, string>();
    keys.forEach((k, i) => map.set(k, PALETTE[i % PALETTE.length]));
    return map;
  }, [rows]);

  const { members, projectsInMonth, totalMonthHours } = useMemo(() => {
    const monthRows = rows.filter((r) => r.month === selectedMonth);

    // Group by member.
    const byMember = new Map<string, MemberProjectHoursRow[]>();
    for (const r of monthRows) {
      const arr = byMember.get(r.member_id) ?? [];
      arr.push(r);
      byMember.set(r.member_id, arr);
    }

    const result: MemberWorkload[] = [];
    let monthHours = 0;
    const projectSet = new Map<string, { name: string; kind: "project" | "internal"; color: string }>();

    for (const [memberId, memberRows] of byMember) {
      const totalHours = memberRows.reduce((s, r) => s + r.hours, 0);
      monthHours += totalHours;
      const entriesWithoutHours = memberRows
        .filter((r) => r.hours <= 0)
        .reduce((s, r) => s + r.entries, 0);

      // The bar is "% of hours" — only projects with logged hours are segments.
      const segments: Segment[] = memberRows
        .filter((r) => r.hours > 0)
        .map((r) => {
          const key = `${r.project_kind}:${r.project_id}`;
          const color = colorByKey.get(key) ?? PALETTE[0];
          projectSet.set(key, { name: r.project_name, kind: r.project_kind, color });
          return {
            projectId: r.project_id,
            projectName: r.project_name,
            kind: r.project_kind,
            hours: r.hours,
            pct: totalHours > 0 ? round1((r.hours / totalHours) * 100) : 0,
            color,
          };
        })
        .sort((a, b) => b.hours - a.hours);

      result.push({
        memberId,
        memberName: memberRows[0].member_name,
        totalHours,
        segments,
        entriesWithoutHours,
      });
    }

    result.sort((a, b) => b.totalHours - a.totalHours);

    const projectsInMonth = Array.from(projectSet.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { members: result, projectsInMonth, totalMonthHours: monthHours };
  }, [rows, selectedMonth, colorByKey]);

  if (months.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-text-muted">
        No work feedback logged yet — once team members log hours, their per-project split appears here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls + month summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-wider text-text-muted">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-elevated border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-text-muted tabular-nums">
          <span>
            <span className="text-text-primary font-semibold">{members.length}</span> members
          </span>
          <span>
            <span className="text-text-primary font-semibold">{projectsInMonth.length}</span> projects
          </span>
          <span>
            <span className="text-text-primary font-semibold">{round1(totalMonthHours)}h</span> logged
          </span>
        </div>
      </div>

      {/* Shared project legend */}
      {projectsInMonth.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {projectsInMonth.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
              <span className="truncate max-w-[180px]">{p.name}</span>
              {p.kind === "internal" && (
                <span className="text-[9px] uppercase tracking-wide text-text-muted border border-border rounded px-1">
                  int
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Per-member stacked bars */}
      {members.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-xs text-text-muted">
          No hours logged for {monthLabel(selectedMonth)}.
        </div>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {members.map((m) => (
            <li key={m.memberId} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-text-primary font-medium truncate">{m.memberName}</span>
                <span className="text-[11px] text-text-muted tabular-nums shrink-0">
                  {round1(m.totalHours)}h
                </span>
              </div>
              {m.segments.length > 0 ? (
                <div className="flex h-6 w-full rounded-md overflow-hidden bg-muted/40">
                  {m.segments.map((s) => (
                    <div
                      key={`${s.kind}:${s.projectId}`}
                      className="h-full flex items-center justify-center group relative transition-opacity hover:opacity-90"
                      style={{ width: `${Math.max(s.pct, 0.5)}%`, background: s.color }}
                      title={`${s.projectName} — ${round1(s.hours)}h (${s.pct}%)`}
                    >
                      {s.pct >= 10 && (
                        <span className="text-[10px] font-medium text-white/95 tabular-nums px-1 truncate">
                          {s.pct}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-6 w-full items-center rounded-md bg-muted/30 px-2">
                  <span className="text-[10px] text-text-muted italic">
                    {m.entriesWithoutHours} feedback {m.entriesWithoutHours === 1 ? "entry" : "entries"} logged · no hours recorded
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
