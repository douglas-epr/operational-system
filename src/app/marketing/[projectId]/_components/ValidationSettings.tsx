"use client";

/**
 * ValidationSettings — validation decision + positioning (no funnel mode; all
 * projects run Hybrid). Positioning feeds AI-personalised outreach + content.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MktValidation, MktValidationStatus } from "@/types/marketing";
import { VALIDATION_STATUS_LABELS } from "@/types/marketing";
import { updateValidation } from "../../actions";
import Button from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

export default function ValidationSettings({
  projectId,
  validation,
}: {
  projectId: string;
  validation: MktValidation;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<MktValidationStatus>(validation.status);
  const [positioning, setPositioning] = useState(validation.positioning ?? "");

  function save() {
    setError(null);
    start(async () => {
      const r = await updateValidation(projectId, {
        status,
        positioning: positioning.trim() || null,
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  return (
    <div id="positioning" className="card space-y-4 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-heading-3 text-text-primary">Validation settings</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-primary">Decision</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MktValidationStatus)}
            className="px-3 py-1.5 bg-elevated border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {(Object.keys(VALIDATION_STATUS_LABELS) as MktValidationStatus[]).map(
              (s) => (
                <option key={s} value={s}>
                  {VALIDATION_STATUS_LABELS[s]}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Positioning
          <span className="text-text-muted font-normal">
            {" "}
            — what you&apos;re testing; feeds AI-personalised outreach + content
          </span>
        </label>
        <textarea
          value={positioning}
          onChange={(e) => setPositioning(e.target.value)}
          rows={3}
          className={inputCls}
          placeholder="e.g. An AI tool that automates monthly bookkeeping reconciliation for UK accountancy practices."
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-sm text-red-400">{error}</span>}
        <Button onClick={save} loading={isPending}>
          {saved ? (
            <>
              <CheckIcon className="w-4 h-4" strokeWidth={2} /> Saved
            </>
          ) : (
            "Save settings"
          )}
        </Button>
      </div>
    </div>
  );
}
