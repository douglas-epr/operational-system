"use client";

import { useState, useTransition, useEffect } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { UserMultiSelect } from "@/components/ui";
import { createSop, updateSop, createTag } from "../actions";
import type { SopWithTags, SopTag } from "@/types/sops";
import { USER_TYPE_OPTIONS } from "@/types/sops";
import type { UserType, UserProfile } from "@/types/projects";

interface Props {
  open: boolean;
  onClose: () => void;
  sop: SopWithTags | null;
  allTags: SopTag[];
  profiles: UserProfile[];
  onTagCreated: (tag: SopTag) => void;
  isAdminOrManager?: boolean;
}

export default function SopModal({ open, onClose, sop, allTags, profiles, onTagCreated, isAdminOrManager = false }: Props) {
  const isEdit = !!sop;

  const [name, setName]                   = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes]   = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers]   = useState<string[]>([]);
  const [error, setError]                   = useState("");
  const [newTagName, setNewTagName]         = useState("");
  const [showTagInput, setShowTagInput]     = useState(false);
  const [isPending, startTransition]        = useTransition();
  const [creatingTag, startTagTransition]   = useTransition();

  useEffect(() => {
    if (sop) {
      setName(sop.name ?? "");
      setSelectedTagIds(sop.tags.map((t) => t.id));
      setSelectedTypes(sop.authorized_user_types);
      setSelectedUsers(sop.authorized_users);
    } else {
      setName(""); setSelectedTagIds([]); setSelectedTypes([]); setSelectedUsers([]);
    }
    setError(""); setNewTagName(""); setShowTagInput(false);
  }, [sop, open]);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleType(type: UserType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
    );
  }

  function handleCreateTag() {
    if (!newTagName.trim()) return;
    startTagTransition(async () => {
      const result = await createTag(newTagName.trim());
      if (result.tag) {
        onTagCreated(result.tag);
        setSelectedTagIds((prev) => [...prev, result.tag!.id]);
        setNewTagName("");
        setShowTagInput(false);
      }
    });
  }

  function handleSubmit() {
    if (!name.trim()) return setError("Name is required.");
    setError("");
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        tag_ids: selectedTagIds,
        authorized_user_types: selectedTypes,
        authorized_users: selectedUsers,
      };
      const result = isEdit
        ? await updateSop(sop!.id, payload)
        : await createSop(payload);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit SOP" : "Create SOP"} width="max-w-lg">
      <div className="px-6 pb-6 flex flex-col gap-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Name <span className="text-red-400">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="One-one meeting" className="input-field" />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors border ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-accent text-white border-accent"
                    : "bg-muted text-text-secondary border-border hover:border-accent"
                }`}
              >
                {tag.name}
              </button>
            ))}
            {allTags.length === 0 && <span className="text-xs text-text-muted">No tags yet.</span>}
          </div>
          {/* "Create new tag" affordance lives BELOW the pill list — easier
             to spot once the user has scanned the existing tags and decided
             none fit. The hidden inline input collapses by default. */}
          <button
            type="button"
            onClick={() => setShowTagInput((v) => !v)}
            className="self-start text-xs text-accent hover:underline"
          >
            Didn&apos;t find the tag? Create one now
          </button>
          {showTagInput && (
            <div className="flex gap-2 mt-1">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name…"
                className="input-field flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              />
              <button
                onClick={handleCreateTag}
                disabled={creatingTag}
                className="px-3 py-1.5 rounded-md bg-accent text-white text-xs hover:bg-accent-hover transition-colors"
              >
                {creatingTag ? "…" : "Add"}
              </button>
            </div>
          )}
        </div>

        {/* Authorized User Types — admin/manager only */}
        {isAdminOrManager && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-secondary">Authorized User Types</label>
            <div className="flex flex-wrap gap-1.5">
              {USER_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors border ${
                    selectedTypes.includes(value)
                      ? "bg-accent text-white border-accent"
                      : "bg-muted text-text-secondary border-border hover:border-accent"
                  }`}
                >
                  {selectedTypes.includes(value) && <span className="mr-1">×</span>}
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Authorized Users — admin/manager only */}
        {isAdminOrManager && (
          <UserMultiSelect
            label="Authorized Users"
            value={selectedUsers}
            onChange={setSelectedUsers}
            options={profiles.map((p) => ({
              id: p.id,
              name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
              role: p.type ?? null,
              picture: p.picture ?? null,
            }))}
            placeholder="Add people"
          />
        )}


        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:bg-muted transition-colors">
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isPending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
