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
import type { MktLanding } from "@/types/marketing";
import { saveLanding, generateLandingPage } from "../actions";
import { slugify } from "@/lib/marketing/slug";
import Button from "@/components/ui/Button";
import { ExternalLinkIcon, LinkIcon, SparkleIcon } from "@/components/ui/icons";

/** Staged progress labels for the LP generation pipeline. */
const LP_AI_STAGES = ["Researching", "Writing copy", "Designing UI", "Reviewing"];

interface Props {
  projectId: string;
  initialLanding: MktLanding | null;
  defaultSlug: string;
}

const CODE_CLS =
  "w-full px-3 py-2 bg-[#0d0d0d] border border-border rounded-md text-xs text-green-300 font-mono placeholder:text-text-muted focus:outline-none focus:border-accent resize-y";

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
  const [slug] = useState(initialLanding?.slug ?? slugify(defaultSlug));
  const [code, setCode] = useState(initialLanding?.code_html ?? "");
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
      const r = await saveLanding(projectId, {
        id,
        slug,
        code_html: code,
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
