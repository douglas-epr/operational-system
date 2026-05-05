"use client";

import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/types/projects";

interface UserPickerProps {
  /** All profiles the picker can choose from. */
  profiles: UserProfile[];
  /** Currently selected user IDs. */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

function fullName(p: UserProfile): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "?";
}

function initials(p: UserProfile): string {
  const a = (p.first_name?.[0] ?? "").toUpperCase();
  const b = (p.last_name?.[0] ?? "").toUpperCase();
  return (a + b) || "?";
}

function Avatar({
  profile, size = 28, selectable, onRemove,
}: {
  profile: UserProfile;
  size?: number;
  selectable?: boolean;
  onRemove?: () => void;
}) {
  const name = fullName(profile);
  return (
    <div
      className="relative group shrink-0"
      style={{ width: size, height: size }}
      title={name}
    >
      <div
        className="w-full h-full rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center overflow-hidden"
      >
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.picture} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials(profile)}</span>
        )}
      </div>
      {selectable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function UserPicker({
  profiles,
  selectedIds,
  onChange,
  placeholder = "Add user…",
}: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const selected = selectedIds.map((id) => profileMap.get(id)).filter(Boolean) as UserProfile[];
  const available = profiles.filter((p) => !selectedIds.includes(p.id));

  const add = (id: string) => onChange([...selectedIds, id]);
  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  return (
    <div
      ref={ref}
      className="relative bg-muted border border-border rounded-md"
    >
      <div className="flex items-center flex-wrap gap-1.5 p-2 min-h-[44px]">
        {selected.length === 0 && (
          <span className="text-xs text-text-muted px-1">{placeholder}</span>
        )}
        {selected.map((p) => (
          <Avatar key={p.id} profile={p} selectable onRemove={() => remove(p.id)} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-full border border-dashed border-border text-text-muted hover:text-text-primary hover:border-accent transition-colors flex items-center justify-center text-sm leading-none shrink-0"
          aria-label="Add user"
        >
          +
        </button>
      </div>

      {open && available.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-elevated border border-border rounded-md shadow-lg py-1 max-h-64 overflow-y-auto">
          {available.map((p) => {
            const name = fullName(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { add(p.id); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-muted transition-colors"
              >
                <Avatar profile={p} size={32} />
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </div>
      )}

      {open && available.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-elevated border border-border rounded-md shadow-lg py-2 px-3">
          <span className="text-xs text-text-muted">All users selected.</span>
        </div>
      )}
    </div>
  );
}
