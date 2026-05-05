"use client";

/**
 * Share-link modal — invoked from a talent row's share icon.
 * Generates a 4-hour token via generateShareLink() and shows the
 * resulting public URL with a "Copy" button.
 */

import { useEffect, useState, useTransition } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { generateShareLink } from "../../actions";

interface Props {
  open: boolean;
  onClose: () => void;
  talentId: string | null;
  talentName: string | null;
}

export default function ShareLinkModal({ open, onClose, talentId, talentName }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open || !talentId) return;
    setUrl(null);
    setExpiresAt(null);
    setCopied(false);
    setError(null);
    start(async () => {
      const r = await generateShareLink(talentId);
      if (r.error) { setError(r.error); return; }
      if (r.code) {
        setUrl(`${window.location.origin}/talent-profile?code=${r.code}`);
        setExpiresAt(r.expiresAt ?? null);
      }
    });
  }, [open, talentId]);

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal open={open} onClose={onClose} title="Share self-edit link" width="max-w-lg">
      <div className="px-6 pb-6 space-y-4">
        {talentName && (
          <p className="text-sm text-text-secondary">
            Send this link to <span className="text-text-primary font-medium">{talentName}</span>.
            They&apos;ll be able to edit their own profile for the next 4 hours without signing in.
          </p>
        )}

        {pending && <p className="text-sm text-text-muted">Generating link…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {url && (
          <>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                className="input-field flex-1 text-xs"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={copy}
                className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {expiresAt && (
              <p className="text-xs text-text-muted">
                Expires {new Date(expiresAt).toLocaleString()}
              </p>
            )}
            <p className="text-[11px] text-text-muted">
              Re-opening this dialog generates a new link and invalidates any previous one.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
