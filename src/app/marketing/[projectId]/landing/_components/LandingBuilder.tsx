"use client";

/**
 * LandingBuilder — configure a project's public landing page.
 * Edits hero, capture stages (quiz/waitlist; pre-order deferred), and content
 * sections, then saves + publishes. Shows the public URL + live preview link.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  MktLanding,
  MktLandingSection,
} from "@/types/marketing";
import { saveLanding, generateLandingPage } from "../actions";
import { slugify } from "@/lib/marketing/slug";
import Button from "@/components/ui/Button";
import {
  AddIcon,
  DeleteIcon,
  ExternalLinkIcon,
  LinkIcon,
  SparkleIcon,
} from "@/components/ui/icons";

/** Staged progress labels for the LP generation pipeline. */
const LP_AI_STAGES = ["Researching", "Writing copy", "Designing UI", "Reviewing", "Finalising"];

interface Props {
  projectId: string;
  initialLanding: MktLanding | null;
  defaultSlug: string;
}

type SectionType = MktLandingSection["type"];

const CODE_CLS =
  "w-full px-3 py-2 bg-[#0d0d0d] border border-border rounded-md text-xs text-green-300 font-mono placeholder:text-text-muted focus:outline-none focus:border-accent resize-y";

const SECTION_TYPES: { value: SectionType; label: string; itemised: boolean }[] = [
  { value: "text", label: "Text block", itemised: false },
  { value: "features", label: "Features grid", itemised: true },
  { value: "faq", label: "FAQ", itemised: true },
  { value: "quiz", label: "Quiz questions", itemised: true },
  { value: "custom_html", label: "Custom HTML", itemised: false },
];

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

export default function LandingBuilder({
  projectId,
  initialLanding,
  defaultSlug,
}: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(
    initialLanding?.slug ?? null
  );

  const [id] = useState(initialLanding?.id);
  const [slug, setSlug] = useState(initialLanding?.slug ?? slugify(defaultSlug));
  const [title, setTitle] = useState(initialLanding?.title ?? "");
  const [headline, setHeadline] = useState(initialLanding?.hero?.headline ?? "");
  const [subheadline, setSubheadline] = useState(
    initialLanding?.hero?.subheadline ?? ""
  );
  const [ctaLabel, setCtaLabel] = useState(initialLanding?.hero?.cta_label ?? "");
  const [stages, setStages] = useState<string[]>(
    initialLanding?.capture_stages ?? ["waitlist"]
  );
  const [sections, setSections] = useState<MktLandingSection[]>(
    initialLanding?.sections ?? []
  );
  const [published, setPublished] = useState(initialLanding?.published ?? false);

  // AI generation state
  const [aiPending, setAiPending] = useState(false);
  const [aiStage, setAiStage] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLog, setAiLog] = useState<string | null>(null);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = savedSlug ? `${appUrl}/m/${savedSlug}` : null;

  function toggleStage(stage: string) {
    setStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  }

  function addSection(type: SectionType) {
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        heading: "",
        body: "",
        items: SECTION_TYPES.find((t) => t.value === type)?.itemised
          ? [{ title: "", body: "" }]
          : undefined,
      },
    ]);
  }

  function updateSection(sid: string, patch: Partial<MktLandingSection>) {
    setSections((prev) =>
      prev.map((s) => (s.id === sid ? { ...s, ...patch } : s))
    );
  }

  function removeSection(sid: string) {
    setSections((prev) => prev.filter((s) => s.id !== sid));
  }

  async function buildWithAI() {
    setAiPending(true);
    setAiStage(0);
    setAiError(null);
    setAiLog(null);
    const timer = setInterval(
      () => setAiStage((s) => Math.min(s + 1, LP_AI_STAGES.length - 1)),
      14_000
    );
    try {
      const r = await generateLandingPage(projectId);
      if (r.error) { setAiError(r.error); return; }
      if (r.title)              setTitle(r.title);
      if (r.hero?.headline)     setHeadline(r.hero.headline);
      if (r.hero?.subheadline)  setSubheadline(r.hero.subheadline);
      if (r.hero?.cta_label)    setCtaLabel(r.hero.cta_label);
      if (r.sections)           setSections(r.sections);
      if (r.agentLog)           setAiLog(r.agentLog);
    } finally {
      clearInterval(timer);
      setAiPending(false);
    }
  }

  function save() {
    setError(null);
    start(async () => {
      const r = await saveLanding(projectId, {
        id,
        slug,
        title: title || null,
        hero: {
          headline: headline || undefined,
          subheadline: subheadline || undefined,
          cta_label: ctaLabel || undefined,
        },
        sections,
        capture_stages: stages,
        published,
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.slug) setSavedSlug(r.slug);
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl space-y-8">

      {/* ── AI Build button ────────────────────────────────────────────── */}
      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-accent" strokeWidth={1.5} />
              Build with AI
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Generate the complete landing page — hero, sections, and branded HTML — from your project's idea, positioning statement, and brand DNA.
            </p>
          </div>
          <button
            onClick={buildWithAI}
            disabled={aiPending || isPending}
            className="btn btn-secondary btn-sm shrink-0 flex items-center gap-2 disabled:opacity-50"
          >
            <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {aiPending ? "Building…" : "Build with AI"}
          </button>
        </div>

        {/* Staged progress chips */}
        {aiPending && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {LP_AI_STAGES.map((label, i) => (
              <span
                key={label}
                className={[
                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  i < aiStage
                    ? "border-accent/40 text-accent bg-accent/5"
                    : i === aiStage
                    ? "border-accent text-accent bg-accent/10 animate-pulse"
                    : "border-border text-text-muted",
                ].join(" ")}
              >
                {i < aiStage ? "✓ " : ""}{label}
              </span>
            ))}
          </div>
        )}

        {aiError && <p className="text-xs text-red-400">{aiError}</p>}
        {!aiPending && aiLog && <p className="text-[11px] text-text-muted">{aiLog}</p>}
      </section>

      {/* Public URL banner */}
      {publicUrl && (
        <div className="card flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs text-text-muted mb-0.5">Public URL</p>
            <p className="text-sm text-text-primary font-mono truncate">{publicUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(publicUrl)}
              className="btn btn-tertiary btn-sm"
            >
              <LinkIcon className="w-4 h-4" strokeWidth={2} /> Copy
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLinkIcon className="w-4 h-4" strokeWidth={2} /> Preview
            </a>
          </div>
        </div>
      )}

      {/* Basics */}
      <section className="space-y-4">
        <h2 className="text-heading-3 text-text-primary">Basics</h2>
        <Field label="URL slug" hint="Lowercase letters, numbers, hyphens. Forms the /m/<slug> address.">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => setSlug((s) => slugify(s))}
            className={inputCls}
            placeholder="my-product"
          />
        </Field>
        <Field label="Internal title" hint="Shown in the browser tab; not on the page hero.">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder="My Product — Waitlist"
          />
        </Field>
      </section>

      {/* Hero */}
      <section className="space-y-4">
        <h2 className="text-heading-3 text-text-primary">Hero</h2>
        <Field label="Headline">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={inputCls}
            placeholder="The fastest way to…"
          />
        </Field>
        <Field label="Subheadline">
          <textarea
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="One or two sentences on the value and who it's for."
          />
        </Field>
        <Field label="Call-to-action label">
          <input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            className={inputCls}
            placeholder="Join the waitlist"
          />
        </Field>
      </section>

      {/* Capture stages */}
      <section className="space-y-3">
        <h2 className="text-heading-3 text-text-primary">Capture stages</h2>
        <p className="text-xs text-text-muted">
          Escalating demand signals. Pre-order needs Stripe and is deferred.
        </p>
        <div className="space-y-2">
          <StageToggle
            label="Quiz"
            desc="Qualifying questions + email. Add a “Quiz questions” section below."
            checked={stages.includes("quiz")}
            onChange={() => toggleStage("quiz")}
          />
          <StageToggle
            label="Waitlist"
            desc="Email capture — the simplest intent signal."
            checked={stages.includes("waitlist")}
            onChange={() => toggleStage("waitlist")}
          />
          <StageToggle
            label="Pre-order / deposit"
            desc="Strongest signal (money). Enabled once Stripe is connected."
            checked={stages.includes("preorder")}
            disabled
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Sections */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-3 text-text-primary">Content sections</h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SECTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => addSection(t.value)}
                className="btn btn-tertiary btn-sm"
              >
                <AddIcon className="w-3.5 h-3.5" strokeWidth={2} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="text-sm text-text-muted">
            No sections yet. Add a text block, features grid, FAQ, or quiz.
          </p>
        ) : (
          <div className="space-y-4">
            {sections.map((s) => (
              <SectionEditor
                key={s.id}
                section={s}
                onChange={(patch) => updateSection(s.id, patch)}
                onRemove={() => removeSection(s.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Publish + save */}
      <section className="card flex items-center justify-between gap-4 flex-wrap">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 accent-[color:var(--accent)]"
          />
          <span className="text-sm text-text-primary font-medium">
            Published
            <span className="text-text-muted font-normal">
              {" "}
              — live and accepting submissions
            </span>
          </span>
        </label>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-400">{error}</span>}
          <Button onClick={save} loading={isPending}>
            Save landing page
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

function StageToggle({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-md border ${
        checked ? "border-accent bg-accent-subtle" : "border-border"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 w-4 h-4 accent-[color:var(--accent)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="block text-xs text-text-muted">{desc}</span>
      </span>
    </label>
  );
}

function SectionEditor({
  section,
  onChange,
  onRemove,
}: {
  section: MktLandingSection;
  onChange: (patch: Partial<MktLandingSection>) => void;
  onRemove: () => void;
}) {
  const meta = SECTION_TYPES.find((t) => t.value === section.type);
  const items = section.items ?? [];

  function updateItem(idx: number, patch: { title?: string; body?: string }) {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ items: next });
  }
  function addItem() {
    onChange({ items: [...items, { title: "", body: "" }] });
  }
  function removeItem(idx: number) {
    onChange({ items: items.filter((_, i) => i !== idx) });
  }

  const isQuiz = section.type === "quiz";
  const isCustomHtml = section.type === "custom_html";

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-text-muted font-semibold">
          {meta?.label ?? section.type}
        </span>
        <button
          onClick={onRemove}
          aria-label="Remove section"
          className="p-1 text-text-muted hover:text-red-400 rounded transition-colors"
        >
          <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {isCustomHtml ? (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Raw HTML/CSS injected directly into the public page. Use standard HTML tags and inline
            styles or a &lt;style&gt; block. Visible to visitors as-is.
          </p>
          <textarea
            value={section.html ?? ""}
            onChange={(e) => onChange({ html: e.target.value })}
            rows={10}
            spellCheck={false}
            className={CODE_CLS}
            placeholder={"<section style=\"padding: 2rem; text-align: center;\">\n  <h2>Your custom section</h2>\n  <p>Add any HTML here.</p>\n</section>"}
          />
        </div>
      ) : (
        <>
          {!isQuiz && (
            <input
              value={section.heading ?? ""}
              onChange={(e) => onChange({ heading: e.target.value })}
              className={inputCls}
              placeholder="Section heading"
            />
          )}

          {meta?.itemised ? (
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      value={it.title ?? ""}
                      onChange={(e) => updateItem(i, { title: e.target.value })}
                      className={inputCls}
                      placeholder={isQuiz ? "Question" : "Title"}
                    />
                    {!isQuiz && (
                      <textarea
                        value={it.body ?? ""}
                        onChange={(e) => updateItem(i, { body: e.target.value })}
                        rows={2}
                        className={inputCls}
                        placeholder="Body"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    aria-label="Remove item"
                    className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors mt-1"
                  >
                    <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              ))}
              <button onClick={addItem} className="btn btn-tertiary btn-sm">
                <AddIcon className="w-3.5 h-3.5" strokeWidth={2} />{" "}
                {isQuiz ? "Add question" : "Add item"}
              </button>
            </div>
          ) : (
            <textarea
              value={section.body ?? ""}
              onChange={(e) => onChange({ body: e.target.value })}
              rows={3}
              className={inputCls}
              placeholder="Body text"
            />
          )}
        </>
      )}
    </div>
  );
}
