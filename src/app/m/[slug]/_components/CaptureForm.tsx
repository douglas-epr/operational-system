"use client";

/**
 * CaptureForm — the demand-capture widget on a public landing page.
 *
 * Supports the staged model: waitlist (email) and quiz (questions + email).
 * Pre-order is stubbed — if the stage is enabled it shows a disabled
 * "coming soon" button (the server also hard-rejects unpaid pre-order writes).
 */

import { useMemo, useState } from "react";

interface Props {
  slug: string;
  stages: string[];
  ctaLabel: string | null;
  quizQuestions: string[];
}

export default function CaptureForm({ slug, stages, ctaLabel, quizQuestions }: Props) {
  const hasQuiz = stages.includes("quiz") && quizQuestions.length > 0;
  const hasWaitlist = stages.includes("waitlist");
  const hasPreorder = stages.includes("preorder");

  const captureType: "quiz" | "waitlist" | null = useMemo(() => {
    if (hasQuiz) return "quiz";
    if (hasWaitlist) return "waitlist";
    return null;
  }, [hasQuiz, hasWaitlist]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  function setAnswer(q: string, v: string) {
    setAnswers((prev) => ({ ...prev, [q]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captureType) return;
    setStatus("submitting");
    setError(null);

    // UTM passthrough from the URL.
    const sp = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = sp.get(k);
      if (v) utm[k] = v;
    }

    const res = await fetch(`/api/m/${slug}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: captureType,
        email,
        name: name || undefined,
        quizAnswers: captureType === "quiz" ? answers : undefined,
        utm,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setStatus("error");
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="card text-center py-8">
        <div className="text-2xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-text-primary">You're on the list</h3>
        <p className="text-sm text-text-secondary mt-1">
          Thanks — we'll be in touch as this develops.
        </p>
      </div>
    );
  }

  if (!captureType) {
    // Only pre-order enabled (deferred) or nothing configured.
    return hasPreorder ? (
      <div className="card text-center py-8">
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          Reservations opening soon
        </h3>
        <p className="text-sm text-text-secondary">
          Pre-orders aren't open yet. Check back shortly.
        </p>
        <button
          disabled
          className="btn btn-primary mt-4 opacity-50 cursor-not-allowed"
        >
          {ctaLabel || "Reserve your spot"}
        </button>
      </div>
    ) : null;
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {captureType === "quiz" && (
        <div className="space-y-4">
          {quizQuestions.map((q) => (
            <div key={q}>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {q}
              </label>
              <input
                value={answers[q] ?? ""}
                onChange={(e) => setAnswer(q, e.target.value)}
                className="w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                placeholder="Your answer"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Name <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          placeholder="you@example.com"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn btn-primary w-full"
      >
        {status === "submitting"
          ? "Submitting…"
          : ctaLabel || (captureType === "quiz" ? "Submit" : "Join the waitlist")}
      </button>

      <p className="text-xs text-text-muted text-center">
        We'll only use your email to follow up about this. No spam.
      </p>
    </form>
  );
}
