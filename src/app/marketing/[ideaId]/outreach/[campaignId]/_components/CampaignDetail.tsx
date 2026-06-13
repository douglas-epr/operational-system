"use client";

/**
 * CampaignDetail — sequence editor, prospect enrollment, and send status.
 * "Run now" triggers the worker immediately (admin-only) instead of waiting
 * for the Vercel Cron tick.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  MktCampaign,
  MktProspect,
  MktSequenceStep,
  MktOutreach,
  MktOutreachStatus,
} from "@/types/marketing";
import {
  saveStep,
  deleteStep,
  enrollProspects,
  setCampaignStatus,
  runOutreachNow,
  markReplied,
} from "../../actions";
import Button from "@/components/ui/Button";
import {
  AddIcon,
  DeleteIcon,
  SparkleIcon,
  CheckIcon,
} from "@/components/ui/icons";

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

const STATUS_STYLE: Record<MktOutreachStatus, string> = {
  queued: "status-not-started",
  sent: "status-in-progress",
  opened: "status-ready-qa",
  replied: "status-done",
  bounced: "status-blocked",
  unsub: "status-archived",
};

interface Props {
  ideaId: string;
  campaign: MktCampaign;
  initialSteps: MktSequenceStep[];
  prospects: MktProspect[];
  initialOutreach: MktOutreach[];
  prospectById: Record<string, MktProspect>;
}

export default function CampaignDetail({
  ideaId,
  campaign,
  initialSteps,
  prospects,
  initialOutreach,
  prospectById,
}: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [runMsg, setRunMsg] = useState<string | null>(null);

  function toggleStatus() {
    const next = campaign.status === "paused" ? "active" : "paused";
    start(async () => {
      await setCampaignStatus(ideaId, campaign.id, next);
      router.refresh();
    });
  }

  function runNow() {
    setRunMsg(null);
    start(async () => {
      const r = await runOutreachNow(ideaId, campaign.id);
      setRunMsg(
        r.error
          ? r.error
          : `Processed ${r.processed ?? 0}, sent ${r.sent ?? 0}, failed ${r.failed ?? 0}.`
      );
      router.refresh();
    });
  }

  const paused = campaign.status === "paused";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-heading-1 text-text-primary">{campaign.name}</h1>
          <p className="text-sm text-text-muted capitalize">
            {campaign.channel} · {campaign.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={toggleStatus} loading={isPending}>
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button onClick={runNow} loading={isPending}>
            Run now
          </Button>
        </div>
      </div>
      {runMsg && <p className="text-sm text-text-muted -mt-4">{runMsg}</p>}

      {/* Sequence editor */}
      <SequenceEditor
        ideaId={ideaId}
        campaignId={campaign.id}
        steps={initialSteps}
      />

      {/* Enrollment */}
      <EnrollPanel
        ideaId={ideaId}
        campaignId={campaign.id}
        prospects={prospects}
        enrolledIds={new Set(initialOutreach.map((o) => o.prospect_id))}
        hasSteps={initialSteps.length > 0}
      />

      {/* Status table */}
      <section>
        <h2 className="text-heading-3 text-text-primary mb-3">
          Status{" "}
          <span className="text-xs text-text-muted font-normal">
            ({initialOutreach.length})
          </span>
        </h2>
        {initialOutreach.length === 0 ? (
          <p className="text-sm text-text-muted">
            No one enrolled yet. Add sequence steps, then enroll prospects.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="px-4 py-2.5 font-medium">Prospect</th>
                  <th className="px-4 py-2.5 font-medium">Step</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Sent</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {initialOutreach.map((o) => {
                  const p = prospectById[o.prospect_id];
                  return (
                    <tr key={o.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5 text-text-primary">
                        {p?.name || p?.email || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-text-muted">{o.step_order}</td>
                      <td className="px-4 py-2.5">
                        <span className={`status-badge ${STATUS_STYLE[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-muted whitespace-nowrap">
                        {o.sent_at ? new Date(o.sent_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {(o.status === "sent" || o.status === "opened") && (
                          <button
                            onClick={() =>
                              start(async () => {
                                await markReplied(ideaId, o.id, true);
                                router.refresh();
                              })
                            }
                            className="text-xs text-accent hover:underline"
                          >
                            Mark replied
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SequenceEditor({
  ideaId,
  campaignId,
  steps,
}: {
  ideaId: string;
  campaignId: string;
  steps: MktSequenceStep[];
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  function addStep() {
    const nextOrder = (steps.at(-1)?.step_order ?? 0) + 1;
    start(async () => {
      await saveStep(ideaId, campaignId, {
        step_order: nextOrder,
        delay_days: steps.length === 0 ? 0 : 3,
        subject_tpl: "",
        body_tpl: "Hi {{first_name}},\n\n",
        ai_personalise: false,
      });
      router.refresh();
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-heading-3 text-text-primary">Sequence</h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={addStep}
          loading={isPending}
          leadingIcon={<AddIcon className="w-4 h-4" strokeWidth={2} />}
        >
          Add step
        </Button>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-text-muted">
          No steps yet. Add the first email. Use{" "}
          <code className="text-accent">{"{{first_name}}"}</code>,{" "}
          <code className="text-accent">{"{{company}}"}</code>,{" "}
          <code className="text-accent">{"{{title}}"}</code>,{" "}
          <code className="text-accent">{"{{ai_opening}}"}</code> as merge tags.
        </p>
      ) : (
        <div className="space-y-4">
          {steps.map((s) => (
            <StepEditor
              key={s.id}
              ideaId={ideaId}
              campaignId={campaignId}
              step={s}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StepEditor({
  ideaId,
  campaignId,
  step,
}: {
  ideaId: string;
  campaignId: string;
  step: MktSequenceStep;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [delay, setDelay] = useState(step.delay_days);
  const [subject, setSubject] = useState(step.subject_tpl ?? "");
  const [body, setBody] = useState(step.body_tpl ?? "");
  const [ai, setAi] = useState(step.ai_personalise);

  function save() {
    start(async () => {
      await saveStep(ideaId, campaignId, {
        id: step.id,
        step_order: step.step_order,
        delay_days: delay,
        subject_tpl: subject,
        body_tpl: body,
        ai_personalise: ai,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      await deleteStep(ideaId, campaignId, step.id);
      router.refresh();
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-text-muted font-semibold">
          Step {step.step_order}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="text-text-muted">Wait</span>
            <input
              type="number"
              min={0}
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value || "0", 10))}
              className="w-16 px-2 py-1 bg-elevated border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <span className="text-text-muted">days</span>
          </label>
          <button
            onClick={remove}
            aria-label="Delete step"
            className="p-1 text-text-muted hover:text-red-400 rounded transition-colors"
          >
            <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject — e.g. Quick question, {{first_name}}"
        className={inputCls}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        placeholder="Body. Use {{first_name}}, {{company}}, {{ai_opening}}…"
        className={`${inputCls} font-mono text-[13px]`}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={ai}
            onChange={(e) => setAi(e.target.checked)}
            className="w-4 h-4 accent-[color:var(--accent)]"
          />
          <SparkleIcon className="w-4 h-4 text-accent" />
          AI-personalise the <code className="text-accent">{"{{ai_opening}}"}</code> line
        </label>
        <Button size="sm" onClick={save} loading={isPending}>
          {saved ? (
            <>
              <CheckIcon className="w-4 h-4" strokeWidth={2} /> Saved
            </>
          ) : (
            "Save step"
          )}
        </Button>
      </div>
    </div>
  );
}

function EnrollPanel({
  ideaId,
  campaignId,
  prospects,
  enrolledIds,
  hasSteps,
}: {
  ideaId: string;
  campaignId: string;
  prospects: MktProspect[];
  enrolledIds: Set<string>;
  hasSteps: boolean;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  const available = prospects.filter((p) => !enrolledIds.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(available.map((p) => p.id)));
  }

  function enroll() {
    setMsg(null);
    start(async () => {
      const r = await enrollProspects(ideaId, campaignId, [...selected]);
      setMsg(r.error ? r.error : `Enrolled ${r.enrolled}.`);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-heading-3 text-text-primary">Enroll prospects</h2>
        <div className="flex items-center gap-2">
          {available.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-accent hover:underline"
            >
              Select all
            </button>
          )}
          <Button
            size="sm"
            onClick={enroll}
            loading={isPending}
            disabled={selected.size === 0 || !hasSteps}
          >
            Enroll {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </div>
      </div>

      {!hasSteps && (
        <p className="text-sm text-amber-400/90 mb-3">
          Add at least one sequence step before enrolling.
        </p>
      )}
      {msg && <p className="text-sm text-text-muted mb-3">{msg}</p>}

      {available.length === 0 ? (
        <p className="text-sm text-text-muted">
          {prospects.length === 0
            ? "No prospects. Add some on the Outreach page."
            : "All prospects are already enrolled."}
        </p>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border/60 max-h-72 overflow-y-auto">
          {available.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30"
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="w-4 h-4 accent-[color:var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-text-primary truncate">
                  {p.name || p.email}
                </span>
                <span className="block text-xs text-text-muted truncate">
                  {p.email}
                  {p.company ? ` · ${p.company}` : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
