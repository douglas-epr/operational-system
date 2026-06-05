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
  MktValidation,
  MktValidationStatus,
  ReferenceSources,
  ReferenceSourceKey,
} from "@/types/marketing";
import { VALIDATION_STATUS_LABELS, REFERENCE_SOURCE_GROUPS } from "@/types/marketing";
import { savePositioning, aiAutoFill, type BrandDnaInput } from "../actions";
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
  projectId,
  validation,
}: {
  projectId: string;
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

  function updateDna(patch: Partial<BrandDnaInput>) {
    setDna((prev) => ({ ...prev, ...patch }));
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
      const r = await savePositioning(projectId, {
        status,
        positioning: positioning.trim() || null,
        brandDna: dna,
        referenceSources: cleanedRefs,
      });
      if (r.error) { setError(r.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  async function runAiFill() {
    setAiError(null);
    setAiPending(true);
    const r = await aiAutoFill(projectId);
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
