"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SopWithTags, SopTag } from "@/types/sops";
import type { UserProfile } from "@/types/projects";
import { deleteSop } from "../actions";
import SopModal from "./SopModal";
import Modal from "@/app/projects/_components/modals/Modal";
import { AddIcon, FilterIcon, EditIcon, DeleteIcon } from "@/components/ui/icons";

interface Props {
  sops: SopWithTags[];
  allTags: SopTag[];
  profiles: UserProfile[];
  activeSopId: string | null;
  currentUserId: string;
  isAdminOrManager: boolean;
}

export default function SopList({ sops, allTags, profiles, activeSopId, currentUserId, isAdminOrManager }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch]         = useState("");
  const [tagFilter, setTagFilter]   = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [sopModal, setSopModal]     = useState<{ open: boolean; sop: SopWithTags | null }>({ open: false, sop: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; sop: SopWithTags | null }>({ open: false, sop: null });
  const [localTags, setLocalTags]   = useState(allTags);
  const [localSops, setLocalSops]   = useState(sops);

  // Sync local state when server re-fetches after router.refresh()
  useEffect(() => { setLocalSops(sops); }, [sops]);
  useEffect(() => { setLocalTags(allTags); }, [allTags]);

  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState("");

  const filtered = localSops.filter((s) => {
    const matchSearch = !search || (s.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTag = tagFilter === "all" || s.tags.some((t) => t.id === tagFilter);
    return matchSearch && matchTag;
  });

  function selectSop(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sop", id);
    router.push(`/sops?${params.toString()}`);
  }

  function handleTagCreated(tag: SopTag) {
    setLocalTags((prev) => [...prev, tag]);
  }

  function handleModalClose() {
    setSopModal({ open: false, sop: null });
    router.refresh();
  }

  function handleDelete() {
    if (!deleteModal.sop) return;
    const id = deleteModal.sop.id;
    startDelete(async () => {
      const res = await deleteSop(id);
      if (res.error) {
        setDeleteError(res.error);
        return;
      }
      setLocalSops((prev) => prev.filter((s) => s.id !== id));
      setDeleteModal({ open: false, sop: null });
      // If deleted sop was active, clear selection
      if (activeSopId === id) {
        router.push("/sops");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-text-primary">Documents</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSopModal({ open: true, sop: null })}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            title="New SOP"
          >
            <AddIcon className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${showFilters ? "bg-accent/20 text-accent" : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"}`}
            title="Toggle filters"
          >
            <FilterIcon className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-3 py-3 border-b border-border flex flex-col gap-2 shrink-0">
          <input
            type="text"
            placeholder="Search SOPs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-sm h-8 px-2"
          />
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="input-field text-sm h-8 px-2"
          >
            <option value="all">All Tags</option>
            {localTags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-10 px-4">
            {localSops.length === 0 ? "No SOPs yet. Click + to create one." : "No results."}
          </p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => selectSop(s.id)}
              className={`group flex items-start justify-between px-4 py-3 cursor-pointer border-b border-border/50 transition-colors ${
                s.id === activeSopId
                  ? "bg-accent/10 border-l-2 border-l-accent"
                  : "hover:bg-surface-hover"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${s.id === activeSopId ? "text-accent" : "text-text-primary"}`}>
                  {s.name ?? "Untitled"}
                </p>
                {s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.tags.slice(0, 3).map((t) => (
                      <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                        {t.name}
                      </span>
                    ))}
                    {s.tags.length > 3 && (
                      <span className="text-[10px] text-text-secondary">+{s.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions — only for admin/manager or the creator */}
              {(isAdminOrManager || s.created_by === currentUserId) && (
                <div className={`flex items-center gap-1 ml-2 shrink-0 transition-opacity ${s.id === activeSopId ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSopModal({ open: true, sop: s }); }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                    title="Edit SOP"
                  >
                    <EditIcon className="w-3 h-3" strokeWidth={2} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, sop: s }); setDeleteError(""); }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface text-text-secondary hover:text-red-400"
                    title="Delete SOP"
                  >
                    <DeleteIcon className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <SopModal
        open={sopModal.open}
        onClose={handleModalClose}
        sop={sopModal.sop}
        allTags={localTags}
        profiles={profiles}
        onTagCreated={handleTagCreated}
        isAdminOrManager={isAdminOrManager}
      />

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, sop: null })}
        title="Delete SOP"
      >
        <p className="text-sm text-text-secondary mb-4">
          Are you sure you want to delete <span className="text-text-primary font-medium">&ldquo;{deleteModal.sop?.name}&rdquo;</span>? This will also delete all versions. This action cannot be undone.
        </p>
        {deleteError && <p className="text-sm text-red-400 mb-3">{deleteError}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteModal({ open: false, sop: null })}
            className="btn-ghost text-sm px-4 py-2"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
