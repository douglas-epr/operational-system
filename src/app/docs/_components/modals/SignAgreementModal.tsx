"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/projects";
import type { AgreementVersion } from "@/types/docs";
import { signAgreement } from "../../actions";

interface Props {
  agreement: AgreementVersion;
  currentUserProfile: UserProfile | null;
  onClose: () => void;
}

export default function SignAgreementModal({
  agreement,
  currentUserProfile,
  onClose,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const signature = currentUserProfile?.signature ?? null;
  const hasSignature = !!signature;
  const fullName =
    [currentUserProfile?.first_name, currentUserProfile?.last_name]
      .filter(Boolean)
      .join(" ") || "Signer";

  function handleSign() {
    if (!hasSignature) return;
    setError(null);
    startTransition(async () => {
      const res = await signAgreement(agreement.id);
      if (res.error) setError(res.error);
      else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            Sign agreement
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-sm text-text-primary">
              You are about to sign{" "}
              <span className="font-semibold">
                {agreement.name ?? "this agreement"}
              </span>{" "}
              as <span className="font-semibold">{fullName}</span>.
            </p>
            <p className="text-xs text-text-muted mt-1">
              A signature block will be appended to the agreement content with
              today&rsquo;s timestamp.
            </p>
          </div>

          <div className="border border-border rounded-md p-3 bg-muted/30">
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">
              Your signature
            </p>
            {hasSignature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signature!}
                alt="Your signature"
                className="max-h-20 bg-white rounded border border-border p-2"
              />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-secondary">
                  You don&rsquo;t have a signature yet.
                </p>
                <Link
                  href="/profile"
                  className="text-xs text-accent hover:underline"
                >
                  Go to Profile to upload or draw a signature →
                </Link>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400 border border-red-500/30 rounded-md bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!hasSignature || pending}
            className="px-4 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Signing…" : "Sign agreement"}
          </button>
        </div>
      </div>
    </div>
  );
}
