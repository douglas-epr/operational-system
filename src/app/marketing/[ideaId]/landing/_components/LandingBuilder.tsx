"use client";

/**
 * LandingBuilder — configure a project's public landing page.
 *
 * The landing page is now a single full HTML document (`code_html`), generated
 * in Claude Code or by "Build with AI", and rendered on /m/[slug] inside a
 * sandboxed iframe. Three groups: Build with AI, Public URL, and Code.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MktLanding, QuizQuestion } from "@/types/marketing";
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
const LP_AI_STAGES = ["Researching", "Writing copy", "Designing UI", "Reviewing"];

interface Props {
  ideaId: string;
  initialLanding: MktLanding | null;
  defaultSlug: string;
}

const CODE_CLS =
  "w-full px-3 py-2 bg-[#0d0d0d] border border-border rounded-md text-xs text-green-300 font-mono placeholder:text-text-muted focus:outline-none focus:border-accent resize-y";

export default function LandingBuilder({
  ideaId,
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
  const [slug] = useState(initialLanding?.slug ?? slugify(defaultSlug));
  const [code, setCode] = useState(initialLanding?.code_html ?? "");
  const [published, setPublished] = useState(initialLanding?.published ?? false);
  const [quizSchema, setQuizSchema] = useState<QuizQuestion[]>(
    initialLanding?.quiz_schema ?? []
  );
  const [surveyUrl, setSurveyUrl] = useState(initialLanding?.survey_url ?? "");

  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    setQuizSchema((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function addQuestion() {
    setQuizSchema((prev) => [
      ...prev,
      {
        key: `q${prev.length + 1}`,
        question: "",
        options: [
          { value: "", label: "", icp: true },
          { value: "", label: "", icp: false },
        ],
      },
    ]);
  }
  function removeQuestion(idx: number) {
    setQuizSchema((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateOption(qIdx: number, oIdx: number, label: string, icp: boolean) {
    setQuizSchema((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIdx ? { label, value: slugify(label) || `opt${j + 1}`, icp } : o
              ),
            }
          : q
      )
    );
  }
  function addOption(qIdx: number) {
    setQuizSchema((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, { value: "", label: "", icp: false }] } : q
      )
    );
  }
  function removeOption(qIdx: number, oIdx: number) {
    setQuizSchema((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q
      )
    );
  }

  // AI generation state
  const [aiPending, setAiPending] = useState(false);
  const [aiStage, setAiStage] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLog, setAiLog] = useState<string | null>(null);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = savedSlug ? `${appUrl}/m/${savedSlug}` : null;

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
      const r = await generateLandingPage(ideaId);
      if (r.error) {
        setAiError(r.error);
        return;
      }
      if (r.code_html) setCode(r.code_html);
      if (r.agentLog) setAiLog(r.agentLog);
    } finally {
      clearInterval(timer);
      setAiPending(false);
    }
  }

  function save() {
    setError(null);
    start(async () => {
      const r = await saveLanding(ideaId, {
        id,
        slug,
        code_html: code,
        quiz_schema: quizSchema,
        survey_url: surveyUrl,
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
      {/* ── Build with AI ──────────────────────────────────────────────────── */}
      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-accent" strokeWidth={1.5} />
              Build with AI
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Generate a complete, self-contained landing page — full HTML, CSS, and
              an email capture form — from your project&apos;s idea, positioning, and
              brand DNA. The result drops into the Code field below.
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
                {i < aiStage ? "✓ " : ""}
                {label}
              </span>
            ))}
          </div>
        )}

        {aiError && <p className="text-xs text-red-400">{aiError}</p>}
        {!aiPending && aiLog && <p className="text-[11px] text-text-muted">{aiLog}</p>}
      </section>

      {/* ── Qualification quiz (structured capture) ───────────────────────── */}
      <section className="card space-y-4">
        <div>
          <h2 className="text-heading-3 text-text-primary">Qualification quiz</h2>
          <p className="text-xs text-text-muted mt-1">
            Fixed multiple-choice questions rendered by the AI Designer and validated by the
            capture API — answers become chartable segments. Tick <span className="text-accent font-medium">ICP</span> on
            the options a qualified ICP would choose; signals are auto-scored as ICP-fit
            when at least half their answers are ICP options.
          </p>
        </div>

        {quizSchema.map((q, qi) => (
          <div key={qi} className="rounded-lg border border-border bg-elevated p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted shrink-0">{q.key}</span>
              <input
                value={q.question}
                onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-base border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                placeholder="e.g. How severe is this problem for you today?"
              />
              <button
                onClick={() => removeQuestion(qi)}
                aria-label="Remove question"
                className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors shrink-0"
              >
                <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
            <div className="space-y-1.5 pl-6">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    value={o.label}
                    onChange={(e) => updateOption(qi, oi, e.target.value, o.icp ?? false)}
                    className="flex-1 px-3 py-1.5 bg-base border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    placeholder={`Option ${oi + 1}`}
                  />
                  <label className="flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={o.icp ?? false}
                      onChange={(e) => updateOption(qi, oi, o.label, e.target.checked)}
                      className="w-3.5 h-3.5 accent-[color:var(--accent)]"
                    />
                    ICP
                  </label>
                  <button
                    onClick={() => removeOption(qi, oi)}
                    aria-label="Remove option"
                    className="p-1 text-text-muted hover:text-red-400 rounded transition-colors shrink-0"
                  >
                    <DeleteIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              ))}
              <button onClick={() => addOption(qi)} className="btn btn-tertiary btn-sm">
                <AddIcon className="w-3 h-3" strokeWidth={2} /> Add option
              </button>
            </div>
          </div>
        ))}

        <button onClick={addQuestion} className="btn btn-tertiary btn-sm">
          <AddIcon className="w-3.5 h-3.5" strokeWidth={2} /> Add question
        </button>

        <div className="pt-2 border-t border-border">
          <label className="block text-sm font-medium text-text-primary mb-0.5">
            Post-capture micro-survey URL
          </label>
          <p className="text-xs text-text-muted mb-1.5">
            Tally (or similar) form embedded right after a successful capture — one question
            at peak intent. Answers attach to the signal via the Tally webhook.
          </p>
          <input
            type="url"
            value={surveyUrl}
            onChange={(e) => setSurveyUrl(e.target.value)}
            className="w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            placeholder="https://tally.so/r/xxxxxx"
          />
        </div>
      </section>

      {/* ── Public URL ─────────────────────────────────────────────────────── */}
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

      {/* ── Code ───────────────────────────────────────────────────────────── */}
      <section className="card space-y-3">
        <div>
          <h2 className="text-heading-3 text-text-primary">Code</h2>
          <p className="text-xs text-text-muted mt-1">
            The complete landing page as a single HTML document (with inline CSS and
            optional JS). Rendered in a sandboxed iframe on the public page. To capture
            emails, include a form that posts to{" "}
            <code className="text-green-300">window.__MKT_CAPTURE_URL__</code> with{" "}
            <code className="text-green-300">{`{ type: "waitlist", email }`}</code>.
          </p>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={22}
          spellCheck={false}
          className={CODE_CLS}
          placeholder={"<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <style>/* your styles */</style>\n</head>\n<body>\n  <!-- your landing page -->\n</body>\n</html>"}
        />
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 accent-[color:var(--accent)]"
            />
            <span className="text-sm text-text-primary font-medium">
              Published
              <span className="text-text-muted font-normal"> — live at the public URL</span>
            </span>
          </label>
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-red-400">{error}</span>}
            <Button onClick={save} loading={isPending}>
              Save landing page
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
