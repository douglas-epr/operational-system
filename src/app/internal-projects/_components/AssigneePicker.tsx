"use client";

import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/types/projects";
import { CheckIcon } from "@/components/ui/icons";

interface Props {
  profiles: UserProfile[];
  selected: string[];
  onChange: (ids: string[]) => void;
  assignedProfiles: UserProfile[];
  size?: "sm" | "xs";
}

export default function AssigneePicker({
  profiles,
  selected,
  onChange,
  assignedProfiles,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(userId: string) {
    if (selected.includes(userId)) {
      onChange(selected.filter((id) => id !== userId));
    } else {
      onChange([...selected, userId]);
    }
  }

  const avatarSize = size === "xs" ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[10px]";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 hover:opacity-80"
      >
        {assignedProfiles.length === 0 ? (
          <span
            className={`${avatarSize} rounded-full border border-dashed border-border flex items-center justify-center text-text-muted`}
          >
            +
          </span>
        ) : (
          <div className="flex -space-x-1.5">
            {assignedProfiles.slice(0, 3).map((p) => (
              <Avatar key={p.id} profile={p} sizeClass={avatarSize} />
            ))}
            {assignedProfiles.length > 3 && (
              <span
                className={`${avatarSize} rounded-full bg-muted border border-base flex items-center justify-center text-text-secondary`}
              >
                +{assignedProfiles.length - 3}
              </span>
            )}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 bg-surface border border-border rounded-md shadow-xl w-64 max-h-72 overflow-y-auto">
          {profiles.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">No users</div>
          )}
          {profiles.map((p) => {
            const isSelected = selected.includes(p.id);
            const name =
              [p.first_name, p.last_name].filter(Boolean).join(" ") || "User";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-muted"
              >
                <span
                  className={`w-4 h-4 rounded border ${
                    isSelected
                      ? "bg-accent border-accent"
                      : "border-border bg-transparent"
                  } flex items-center justify-center`}
                >
                  {isSelected && (
                    <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </span>
                <Avatar profile={p} sizeClass="w-6 h-6 text-[10px]" />
                <span className="text-xs text-text-primary truncate">
                  {name}
                </span>
                {p.type && (
                  <span className="ml-auto text-[10px] text-text-muted capitalize">
                    {p.type}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({
  profile,
  sizeClass,
}: {
  profile: UserProfile;
  sizeClass: string;
}) {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "U";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`${sizeClass} rounded-full bg-muted border border-base overflow-hidden flex items-center justify-center text-text-secondary font-semibold shrink-0`}
      title={name}
    >
      {profile.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.picture}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
