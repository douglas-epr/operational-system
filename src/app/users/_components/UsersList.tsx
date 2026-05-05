"use client";

import { useState, useTransition } from "react";
import type { UserRow, UserType } from "@/types/projects";
import { USER_TYPE_LABELS } from "@/types/projects";
import { deleteUser, resendInvitation } from "../actions";
import UserModal from "./UserModal";
import Modal from "@/app/projects/_components/modals/Modal";
import { SearchIcon, AddIcon, DeleteIcon, UsersIcon } from "@/components/ui/icons";

interface Props {
  users: UserRow[];
}

const TYPE_COLORS: Record<UserType, string> = {
  admin:       "bg-[#3b0764] text-[#d8b4fe]",
  manager:     "bg-[#1d3f7a] text-[#93c5fd]",
  operational: "bg-[#1c3557] text-[#7dd3fc]",
  developer:   "bg-[#14532d] text-[#86efac]",
  client:      "bg-[#27272a] text-[#a1a1aa]",
  qa:          "bg-[#422006] text-[#fde68a]",
  referrer:    "bg-[#4c1d95] text-[#c4b5fd]",
  lead:        "bg-[#7f1d1d] text-[#fca5a5]",
};

export default function UsersList({ users }: Props) {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [userModal, setUserModal]     = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });

  const filtered = users.filter((u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || u.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-52"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="all">All Types</option>
            {(Object.entries(USER_TYPE_LABELS) as [UserType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          <button
            onClick={() => setUserModal({ open: true, user: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <AddIcon className="w-4 h-4" strokeWidth={2} />
            New User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr_140px_120px_160px_40px] gap-2 px-4 py-2 bg-elevated text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border">
          <span>#</span>
          <span>Name</span>
          <span>Email</span>
          <span>Country</span>
          <span>Type</span>
          <span />
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <UsersIcon className="w-10 h-10 mb-3 opacity-40" strokeWidth={1.5} />
            <p className="text-sm">No users found.</p>
          </div>
        )}

        {filtered.map((user, idx) => (
          <UserRow
            key={user.id}
            user={user}
            idx={idx + 1}
            onEdit={() => setUserModal({ open: true, user })}
            onDelete={() => setDeleteModal({ open: true, user })}
          />
        ))}
      </div>

      {/* Modals */}
      <UserModal
        open={userModal.open}
        onClose={() => setUserModal({ open: false, user: null })}
        user={userModal.user}
      />
      <DeleteUserModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        user={deleteModal.user}
      />
    </div>
  );
}

// ── User row ───────────────────────────────────────────────────────────────────

function UserRow({
  user, idx, onEdit, onDelete,
}: {
  user: UserRow;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [sending, startSend] = useTransition();
  const [sent, setSent]      = useState(false);

  const name    = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";
  const initial = name[0]?.toUpperCase() ?? "?";

  function handleResend() {
    startSend(async () => {
      await resendInvitation(user.email);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    });
  }

  return (
    <div
      className="grid grid-cols-[40px_1fr_1fr_140px_120px_160px_40px] gap-2 px-4 py-3 border-b border-border/50 items-center hover:bg-muted/30 transition-colors group cursor-pointer"
      onClick={onEdit}
    >
      <span className="text-xs text-text-muted">{idx}</span>

      {/* Name + avatar */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden border-2 border-elevated">
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.picture} alt={name} className="w-full h-full object-cover" />
          ) : initial}
        </div>
        <span className="text-sm text-text-primary truncate">{name}</span>
      </div>

      {/* Email */}
      <span className="text-xs text-text-secondary truncate">{user.email}</span>

      {/* Country */}
      <span className="text-xs text-text-secondary truncate">{user.country ?? "—"}</span>

      {/* Type badge */}
      <span className={`status-badge text-[10px] ${user.type ? TYPE_COLORS[user.type] : "bg-muted text-text-muted"}`}>
        {user.type ? USER_TYPE_LABELS[user.type] : "—"}
      </span>

      {/* Resend invitation */}
      <button
        onClick={(e) => { e.stopPropagation(); handleResend(); }}
        disabled={sending}
        className="px-3 py-1 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {sending ? "Sending…" : sent ? "Sent!" : "Resend Invitation"}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete user"
      >
        <DeleteIcon className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────────

function DeleteUserModal({
  open, onClose, user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleConfirm() {
    if (!user) return;
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      <div className="px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-text-primary">Delete User</h3>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-medium text-text-primary">
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}
            </span>? This action cannot be undone.
          </p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-text-secondary hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
