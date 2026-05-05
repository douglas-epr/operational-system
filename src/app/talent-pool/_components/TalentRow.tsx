"use client";

/**
 * One row in the Talent Pool list view (matches screenshot 1).
 *
 * Layout:
 *   avatar │ name + country + role + company │ Level + Authority chips │
 *          tools chips │ languages chips │ recommended-by chips │
 *          share + edit + delete icons
 */

import type { TalentRow as TalentRowType } from "@/types/talent";
import {
  TOOL_LABELS,
  PROGRAMMING_LANGUAGE_LABELS,
} from "@/types/talent";
import { TALENT_LEVEL_LABELS, TALENT_AUTHORITY_LEVEL_LABELS } from "@/types/projects";
import { ExternalArrowIcon, EditIcon, DeleteIcon } from "@/components/ui/icons";

interface Props {
  talent: TalentRowType;
  companyName: string | null;
  recommenders: { id: string; name: string | null; picture: string | null }[];
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export default function TalentRow({
  talent,
  companyName,
  recommenders,
  onEdit,
  onDelete,
  onShare,
}: Props) {
  const initials = (talent.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid grid-cols-[auto_minmax(0,1.4fr)_auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 bg-elevated border border-border rounded-lg hover:border-accent/40 transition-colors">
      {/* Avatar */}
      <button onClick={onEdit} className="shrink-0">
        {talent.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={talent.picture}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm text-text-muted font-medium">
            {initials || "?"}
          </div>
        )}
      </button>

      {/* Name + role + company */}
      <button onClick={onEdit} className="text-left min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">
          {talent.name ?? "(no name)"}
        </div>
        <div className="text-xs text-text-muted truncate">
          {[talent.country, talent.current_job_position, companyName].filter(Boolean).join(" · ")}
        </div>
      </button>

      {/* Level + Authority chips */}
      <div className="flex flex-col items-start gap-1">
        {talent.level && (
          <Chip>{TALENT_LEVEL_LABELS[talent.level]}</Chip>
        )}
        {talent.authority_level && (
          <Chip variant="muted">{TALENT_AUTHORITY_LEVEL_LABELS[talent.authority_level]}</Chip>
        )}
      </div>

      {/* Tools */}
      <ChipGroup
        items={talent.tools.map((t) => `${TOOL_LABELS[t.tool]}${t.score ? ` ${t.score}` : ""}`)}
      />

      {/* Languages */}
      <ChipGroup
        items={talent.programming_languages.map(
          (l) => `${PROGRAMMING_LANGUAGE_LABELS[l.language]}${l.score ? ` ${l.score}` : ""}`
        )}
      />

      {/* Recommended-by */}
      <div className="flex items-center -space-x-2">
        {recommenders.slice(0, 4).map((r) =>
          r.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={r.id}
              src={r.picture}
              alt={r.name ?? ""}
              title={r.name ?? ""}
              className="w-7 h-7 rounded-full object-cover border-2 border-elevated"
            />
          ) : (
            <div
              key={r.id}
              title={r.name ?? ""}
              className="w-7 h-7 rounded-full bg-muted border-2 border-elevated flex items-center justify-center text-[10px] text-text-muted"
            >
              {(r.name?.[0] || "?").toUpperCase()}
            </div>
          )
        )}
        {recommenders.length > 4 && (
          <div className="w-7 h-7 rounded-full bg-muted border-2 border-elevated flex items-center justify-center text-[10px] text-text-muted">
            +{recommenders.length - 4}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <IconButton onClick={onShare} title="Share self-edit link">
          <ExternalArrowIcon className="w-4 h-4" strokeWidth={2} />
        </IconButton>
        <IconButton onClick={onEdit} title="Edit">
          <EditIcon className="w-4 h-4" strokeWidth={2} />
        </IconButton>
        <IconButton onClick={onDelete} title="Delete" danger>
          <DeleteIcon className="w-4 h-4" strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  );
}

function Chip({ children, variant = "accent" }: { children: React.ReactNode; variant?: "accent" | "muted" }) {
  const cls =
    variant === "accent"
      ? "bg-accent/15 text-accent border-accent/30"
      : "bg-muted text-text-secondary border-border";
  return (
    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

function ChipGroup({ items }: { items: string[] }) {
  if (items.length === 0) return <div className="text-xs text-text-muted">—</div>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 6).map((s, i) => (
        <Chip key={i} variant="muted">{s}</Chip>
      ))}
      {items.length > 6 && (
        <Chip variant="muted">+{items.length - 6}</Chip>
      )}
    </div>
  );
}

function IconButton({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md text-text-muted transition-colors ${
        danger ? "hover:text-red-400 hover:bg-red-500/10" : "hover:text-text-primary hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
