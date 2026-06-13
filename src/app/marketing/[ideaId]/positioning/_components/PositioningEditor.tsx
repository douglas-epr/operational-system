"use client";

/**
 * PositioningEditor — validation decision + positioning statement + Brand DNA.
 * Brand DNA (description, target_audience, communication_style, content_audience_loves)
 * is stored in mkt_validation.icp_definition JSONB and drives AI content generation.
 * AI auto-fill reads the prompt from the Supabase `prompt` table.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  ContractMetric,
  DecisionContract,
  MktValidation,
  MktValidationStatus,
  ReferenceSources,
  ReferenceSourceKey,
} from "@/types/marketing";
import { VALIDATION_STATUS_LABELS, REFERENCE_SOURCE_GROUPS } from "@/types/marketing";
import {
  savePositioning,
  aiAutoFill,
  suggestDecisionContract,
  type BrandDnaInput,
} from "../actions";
import Button from "@/components/ui/Button";
import { CheckIcon, SparkleIcon, AddIcon, DeleteIcon } from "@/components/ui/icons";

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";
const textareaCls = inputCls + " resize-none";

function parseDna(raw: Record<string, unknown>): BrandDnaInput {
  const s = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  return {
    description: s("description"),
    target_audience: s("target_audience"),
    communication_style: s("communication_style"),
    content_audience_loves: s("content_audience_loves"),
  };
}

export default function PositioningEditor({
  ideaId,
  validation,
}: {
  ideaId: string;
  validation: MktValidation;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [status, setStatus] = useState<MktValidationStatus>(validation.status);
  const [positioning, setPositioning] = useState(validation.positioning ?? "");
  const [dna, setDna] = useState<BrandDnaInput>(
    parseDna((validation.icp_definition ?? {}) as Record<string, unknown>)
  );
  const [refs, setRefs] = useState<ReferenceSources>(
    (validation.reference_sources ?? {}) as ReferenceSources
  );
  const [contract, setContract] = useState<DecisionContract>(
    (validation.decision_contract ?? {}) as DecisionContract
  );
  const [bookingUrl, setBookingUrl] = useState(validation.booking_url ?? "");
  const [statusRationale, setStatusRationale] = useState("");
  const [contractPending, setContractPending] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  const statusChanged = status !== validation.status;
  const metrics = contract.success_metrics ?? [];

  function updateDna(patch: Partial<BrandDnaInput>) {
    setDna((prev) => ({ ...prev, ...patch }));
  }

  function updateMetric(idx: number, patch: Partial<ContractMetric>) {
    setContract((prev) => ({
      ...prev,
      success_metrics: (prev.success_metrics ?? []).map((m, i) =>
        i === idx ? { ...m, ...patch } : m
      ),
    }));
  }
  function addMetric() {
    setContract((prev) => ({
      ...prev,
      success_metrics: [
        ...(prev.success_metrics ?? []),
        { metric: "visitor_to_capture_rate", threshold: 8, unit: "%", min_sample: 200, window_days: 21 },
      ],
    }));
  }
  function removeMetric(idx: number) {
    setContract((prev) => ({
      ...prev,
      success_metrics: (prev.success_metrics ?? []).filter((_, i) => i !== idx),
    }));
  }

  async function runContractSuggest() {
    setContractError(null);
    setContractPending(true);
    const r = await suggestDecisionContract(ideaId);
    setContractPending(false);
    if (r.error || !r.data) { setContractError(r.error ?? "AI suggest failed."); return; }
    setContract(r.data);
  }

  function setRefList(key: ReferenceSourceKey, values: string[]) {
    setRefs((prev) => ({ ...prev, [key]: values }));
  }

  function save() {
    setError(null);
    start(async () => {
      // Drop empty strings from each reference list before saving.
      const cleanedRefs: ReferenceSources = {};
      for (const [k, list] of Object.entries(refs)) {
        const trimmed = (list ?? []).map((v) => v.trim()).filter(Boolean);
        if (trimmed.length) cleanedRefs[k as ReferenceSourceKey] = trimmed;
      }
      const r = await savePositioning(ideaId, {
        status,
        statusRationale: statusChanged ? statusRationale : undefined,
        positioning: positioning.trim() || null,
        brandDna: dna,
        referenceSources: cleanedRefs,
        decisionContract: contract,
        bookingUrl,
      });
      if (r.error) { setError(r.error); return; }
      setStatusRationale("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  async function runAiFill() {
    setAiError(null);
    setAiPending(true);
    const r = await aiAutoFill(ideaId);
    setAiPending(false);
    if (r.error || !r.data) { setAiError(r.error ?? "AI fill failed."); return; }
    const { data } = r;
    if (data.positioning) setPositioning(data.positioning);
    setDna({
      description: data.description ?? "",
      target_audience: data.target_audience ?? "",
      communication_style: data.communication_style ?? "",
      content_audience_loves: data.content_audience_loves ?? "",
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Validation decision ─────────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-heading-3 text-text-primary">Validation decision</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MktValidationStatus)}
              className="px-3 py-1.5 bg-elevated border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {(Object.keys(VALIDATION_STATUS_LABELS) as MktValidationStatus[]).map((s) => (
                <option key={s} value={s}>{VALIDATION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {statusChanged && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
            <label className="block text-sm font-medium text-amber-400">
              Why are you changing the status to “{VALIDATION_STATUS_LABELS[status]}”?
              <span className="text-text-muted font-normal"> — required; logged with a metrics snapshot</span>
            </label>
            <textarea
              value={statusRationale}
              onChange={(e) => setStatusRationale(e.target.value)}
              rows={2}
              className={textareaCls}
              placeholder="e.g. 21-day window closed: 2.1% capture rate vs 8% threshold at n=312 sessions; zero ICP-fit captures."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Positioning statement
            <span className="text-text-muted font-normal"> — the demand hypothesis you&apos;re testing</span>
          </label>
          <textarea
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            rows={4}
            className={textareaCls}
            placeholder="e.g. An AI tool that automates monthly bookkeeping reconciliation for UK accountancy practices."
          />
        </div>
      </section>

      {/* ── Decision Contract ─────────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary">Decision Contract</h2>
            <p className="text-xs text-text-muted mt-1">
              Pre-registered success criteria, set <em>before</em> data collection. The dashboard
              tracks progress against these thresholds — so evidence decides, not confirmation bias.
            </p>
          </div>
          <button
            onClick={runContractSuggest}
            disabled={contractPending || isPending}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {contractPending ? "Suggesting…" : "AI suggest"}
          </button>
        </div>

        {contractError && <p className="text-sm text-red-400">{contractError}</p>}

        <Field
          label="Riskiest assumption"
          hint="The single belief that, if false, kills the idea. Specific and falsifiable."
        >
          <textarea
            value={contract.riskiest_assumption ?? ""}
            onChange={(e) => setContract((p) => ({ ...p, riskiest_assumption: e.target.value }))}
            rows={2}
            className={textareaCls}
            placeholder="e.g. People struggling with anxiety will join a moderated community they have never heard of, from a landing page alone."
          />
        </Field>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-0.5">Success metrics</label>
          <p className="text-xs text-text-muted mb-2">
            Each threshold needs a minimum sample — a contract that can be satisfied by noise is worthless.
          </p>
          <div className="space-y-2">
            {metrics.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_55px_80px_70px_28px] gap-2 items-center">
                <input
                  value={m.metric}
                  onChange={(e) => updateMetric(i, { metric: e.target.value })}
                  className={inputCls}
                  placeholder="metric (e.g. visitor_to_capture_rate)"
                />
                <input
                  type="number"
                  value={m.threshold}
                  onChange={(e) => updateMetric(i, { threshold: Number(e.target.value) })}
                  className={inputCls}
                  title="Threshold"
                />
                <input
                  value={m.unit}
                  onChange={(e) => updateMetric(i, { unit: e.target.value })}
                  className={inputCls}
                  title="Unit"
                  placeholder="%"
                />
                <input
                  type="number"
                  value={m.min_sample}
                  onChange={(e) => updateMetric(i, { min_sample: Number(e.target.value) })}
                  className={inputCls}
                  title="Minimum sample (sessions/sends)"
                />
                <input
                  type="number"
                  value={m.window_days}
                  onChange={(e) => updateMetric(i, { window_days: Number(e.target.value) })}
                  className={inputCls}
                  title="Window (days)"
                />
                <button
                  onClick={() => removeMetric(i)}
                  aria-label="Remove metric"
                  className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors"
                >
                  <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
                </button>
              </div>
            ))}
            {metrics.length > 0 && (
              <p className="text-[10px] text-text-muted">
                Columns: metric · threshold · unit · min sample · window (days)
              </p>
            )}
            <button onClick={addMetric} className="btn btn-tertiary btn-sm">
              <AddIcon className="w-3.5 h-3.5" strokeWidth={2} /> Add metric
            </button>
          </div>
        </div>

        <Field
          label="Kill condition"
          hint="The explicit condition under which this idea gets killed. Write it while you are still objective."
        >
          <textarea
            value={contract.kill_condition ?? ""}
            onChange={(e) => setContract((p) => ({ ...p, kill_condition: e.target.value }))}
            rows={2}
            className={textareaCls}
            placeholder="e.g. Below 3% capture rate after 300+ paid ICP sessions AND zero strong-evidence interviews."
          />
        </Field>

        <Field
          label="Interview booking link"
          hint="Cal.com (or similar) link — used as {{booking_link}} in outreach and as the post-capture CTA."
        >
          <input
            type="url"
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
            className={inputCls}
            placeholder="https://cal.com/yourname/20min"
          />
        </Field>
      </section>

      {/* ── Brand DNA ─────────────────────────────────────────────── */}
      <section className="card space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-accent" strokeWidth={1.5} />
              Brand DNA
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Defines the voice and audience of your content. Powers AI-generated posts and outreach.
            </p>
          </div>
          <button
            onClick={runAiFill}
            disabled={aiPending || isPending}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {aiPending ? "Filling…" : "AI fill from idea"}
          </button>
        </div>

        {aiError && <p className="text-sm text-red-400">{aiError}</p>}

        <Field
          label="Description"
          hint="What you do, who you serve, key differentiators, and the core problem you solve."
        >
          <textarea
            value={dna.description}
            onChange={(e) => updateDna({ description: e.target.value })}
            rows={4}
            className={textareaCls}
            placeholder="Be detailed: what you do, who you serve, what makes you different…"
          />
        </Field>

        <Field
          label="Target audience"
          hint="Demographics, psychographics, goals and frustrations of your ideal customer."
        >
          <textarea
            value={dna.target_audience}
            onChange={(e) => updateDna({ target_audience: e.target.value })}
            rows={3}
            className={textareaCls}
            placeholder="Describe who your ideal audience is."
          />
        </Field>

        <Field
          label="Communication style"
          hint="Tone, voice, and personality of the brand (e.g. professional, casual, educational, warm)."
        >
          <textarea
            value={dna.communication_style}
            onChange={(e) => updateDna({ communication_style: e.target.value })}
            rows={2}
            className={textareaCls}
            placeholder="e.g. Warm and educational — we explain complex ideas simply."
          />
        </Field>

        <Field
          label="Content your audience loves"
          hint="Types of content that resonate most (e.g. tips, behind-the-scenes, case studies, founder stories)."
        >
          <textarea
            value={dna.content_audience_loves}
            onChange={(e) => updateDna({ content_audience_loves: e.target.value })}
            rows={2}
            className={textareaCls}
            placeholder="e.g. Quick wins, transformation stories, and honest founder reflections."
          />
        </Field>
      </section>

      {/* ── Reference Sources ─────────────────────────────────────── */}
      <section className="card space-y-5">
        <div>
          <h2 className="text-heading-3 text-text-primary">Reference Sources</h2>
          <p className="text-xs text-text-muted mt-1">
            Paste full URLs of competitor / inspiration accounts and standout posts. The AI Researcher
            studies these (scraped via Apify) to ground every generated post in what works in your niche.
          </p>
        </div>

        {REFERENCE_SOURCE_GROUPS.map((group) => (
          <div key={group.platform} className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-1.5">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.lists.map((list) => (
                <LinkListEditor
                  key={list.key}
                  label={list.label}
                  placeholder={list.placeholder}
                  values={refs[list.key] ?? []}
                  onChange={(vals) => setRefList(list.key, vals)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Save ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-sm text-red-400">{error}</span>}
        <Button onClick={save} loading={isPending}>
          {saved ? (
            <><CheckIcon className="w-4 h-4" strokeWidth={2} /> Saved</>
          ) : (
            "Save settings"
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-0.5">{label}</label>
      <p className="text-xs text-text-muted mb-1.5">{hint}</p>
      {children}
    </div>
  );
}

/**
 * Editable list of single-line URL inputs with add/remove controls.
 * Pattern mirrors LandingBuilder's SectionEditor item list.
 */
function LinkListEditor({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  function updateAt(idx: number, v: string) {
    onChange(values.map((val, i) => (i === idx ? v : val)));
  }
  function removeAt(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...values, ""]);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="space-y-2">
        {values.map((val, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="url"
              value={val}
              onChange={(e) => updateAt(i, e.target.value)}
              className={inputCls}
              placeholder={placeholder}
            />
            <button
              onClick={() => removeAt(i)}
              aria-label="Remove URL"
              className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors shrink-0"
            >
              <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        ))}
        <button onClick={add} className="btn btn-tertiary btn-sm">
          <AddIcon className="w-3.5 h-3.5" strokeWidth={2} /> Add link
        </button>
      </div>
    </div>
  );
}
