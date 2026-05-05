"use client";

import type { UserProfile } from "@/types/projects";
import type { AgreementVersion, OsAgreementStatus } from "@/types/docs";
import { AGREEMENT_STATUS_LABELS } from "@/types/docs";

interface Props {
  agreement: AgreementVersion;
  profiles: UserProfile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSign: () => void;
}

export default function AgreementRow({
  agreement,
  profiles,
  currentUserId,
  isAdminOrManager,
  onOpen,
  onEdit,
  onDelete,
  onSign,
}: Props) {
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const signedCount = agreement.signed_by.length;
  const requiredCount = agreement.required_signers.length;

  const canSign =
    agreement.status === "ready_to_sign" &&
    (agreement.authorized_users.includes(currentUserId) ||
      agreement.required_signers.includes(currentUserId)) &&
    !agreement.signed_by.includes(currentUserId);

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <button
        onClick={onOpen}
        className="flex-1 text-left min-w-0 flex items-center gap-3"
      >
        <div className="min-w-0">
          <p className="text-sm text-text-primary truncate">
            {agreement.name ?? "Untitled agreement"}
          </p>
          <p className="text-[11px] text-text-muted truncate">
            Updated {new Date(agreement.updated_at).toLocaleDateString()}
          </p>
        </div>
      </button>

      <StatusBadge status={agreement.status} />

      <div className="flex items-center gap-1 shrink-0">
        {/* Signer avatars */}
        <div className="flex items-center -space-x-2">
          {agreement.signed_by.slice(0, 4).map((uid) => {
            const p = profileById.get(uid);
            const name = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "?";
            return (
              <div
                key={uid}
                title={`${name} · signed`}
                className="w-6 h-6 rounded-full bg-accent border-2 border-surface flex items-center justify-center text-white text-[9px] font-semibold overflow-hidden"
              >
                {p?.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.picture} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name[0]?.toUpperCase() ?? "?"
                )}
              </div>
            );
          })}
        </div>
        <span className="text-[11px] text-text-muted ml-1">
          {signedCount}/{requiredCount || agreement.authorized_users.length || 0}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canSign && (
          <button
            onClick={onSign}
            className="px-2.5 py-1 text-[11px] rounded-md bg-accent hover:bg-accent-hover text-white"
          >
            Sign
          </button>
        )}
        <button
          onClick={onOpen}
          className="p-1.5 text-text-muted hover:text-text-primary"
          title="View"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        {(isAdminOrManager || agreement.created_by === currentUserId) && (
          <>
            <button
              onClick={onEdit}
              className="p-1.5 text-text-muted hover:text-text-primary"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-text-muted hover:text-red-400"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: OsAgreementStatus }) {
  const color =
    status === "completed"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : status === "ready_to_sign"
      ? "bg-accent/15 text-accent border-accent/30"
      : status === "archived"
      ? "bg-text-muted/15 text-text-muted border-text-muted/30"
      : "bg-muted text-text-muted border-border";
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded-full shrink-0 ${color}`}>
      {AGREEMENT_STATUS_LABELS[status]}
    </span>
  );
}
