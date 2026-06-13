/**
 * Public data-access for the Marketing Validation Engine.
 *
 * These helpers run ONLY in trusted server contexts (the public landing page
 * loader and the /api/m/* route handlers). They use the service-role client so
 * anonymous visitors never touch Supabase directly — the server route is the
 * single controlled choke point for reads/writes, so no anon RLS policy is
 * exposed. All writes are validated here before hitting the DB.
 */

import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { MktLanding, MktSignalType, QuizQuestion } from "@/types/marketing";

/** A published landing page, joined with its idea name for rendering. */
export interface PublicLanding extends MktLanding {
  idea_name: string | null;
  project_name: string | null;
  booking_url: string | null;
}

/** Fetch a published landing page by slug (or null). */
export async function getPublishedLanding(
  slug: string
): Promise<PublicLanding | null> {
  if (!slug) return null;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("mkt_landing" as never)
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const landing = data as unknown as MktLanding | null;
  if (!landing) return null;

  const [{ data: idea }, { data: validation }] = await Promise.all([
    supabase
      .from("idea")
      .select("name, project:project_id(name)")
      .eq("id", landing.idea_id)
      .maybeSingle(),
    supabase
      .from("mkt_validation" as never)
      .select("booking_url")
      .eq("idea_id", landing.idea_id)
      .maybeSingle(),
  ]);

  type IdeaRow = { name: string | null; project: { name: string | null } | null } | null;
  const ideaRow = idea as unknown as IdeaRow;
  const bookingUrl =
    (validation as unknown as { booking_url: string | null } | null)?.booking_url ?? null;

  return {
    ...landing,
    idea_name: ideaRow?.name ?? null,
    project_name: ideaRow?.project?.name ?? null,
    booking_url: bookingUrl,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RecordSignalInput {
  slug: string;
  type: MktSignalType;
  email?: string | null;
  name?: string | null;
  quizAnswers?: Record<string, unknown>;
  utm?: Record<string, unknown>;
}

/**
 * Record a captured demand signal (quiz / waitlist).
 *
 * Pre-order is intentionally NOT accepted here yet — it arrives via the Stripe
 * webhook once that integration is switched on.
 */
export async function recordSignal(
  input: RecordSignalInput
): Promise<{ error?: string; id?: string }> {
  const { slug, type } = input;

  if (type === "preorder") {
    return { error: "Pre-order capture is not enabled yet." };
  }
  if (type !== "quiz" && type !== "waitlist") {
    return { error: "Invalid signal type." };
  }

  const email = input.email?.trim() || null;
  if ((type === "waitlist" || type === "quiz") && (!email || !EMAIL_RE.test(email))) {
    return { error: "A valid email is required." };
  }

  const supabase = createServiceClient();

  const { data: landingRow } = await supabase
    .from("mkt_landing" as never)
    .select("id, idea_id, capture_stages, published, quiz_schema")
    .eq("slug", slug)
    .maybeSingle();

  const landing = landingRow as unknown as {
    id: string;
    idea_id: string;
    capture_stages: string[];
    published: boolean;
    quiz_schema: QuizQuestion[] | null;
  } | null;

  if (!landing || !landing.published) {
    return { error: "This page is not accepting submissions." };
  }
  if (!landing.capture_stages?.includes(type)) {
    return { error: "This submission type is not enabled on this page." };
  }

  // Validate quiz answers against the structured schema (when one is defined)
  // and compute rule-based ICP fit. Schema-less landings accept free-form
  // answers but get icp_fit = null (unknown) — they can't count as ICP evidence.
  const schema = (landing.quiz_schema ?? []) as QuizQuestion[];
  const rawAnswers = input.quizAnswers ?? {};
  let icpFit: boolean | null = null;

  if (schema.length > 0 && Object.keys(rawAnswers).length > 0) {
    const byKey = new Map(schema.map((q) => [q.key, q]));
    for (const [key, value] of Object.entries(rawAnswers)) {
      const q = byKey.get(key);
      if (!q) {
        return { error: `Unknown quiz field "${key}".` };
      }
      const valid = q.options.some((o) => o.value === String(value));
      if (!valid) {
        return { error: `Invalid answer for "${key}".` };
      }
    }

    // ICP fit: among answered questions that define qualifying options,
    // at least half of the chosen answers must be ICP-flagged.
    let qualifying = 0;
    let hits = 0;
    for (const [key, value] of Object.entries(rawAnswers)) {
      const q = byKey.get(key)!;
      if (!q.options.some((o) => o.icp)) continue;
      qualifying++;
      if (q.options.find((o) => o.value === String(value))?.icp) hits++;
    }
    if (qualifying > 0) icpFit = hits * 2 >= qualifying;
  }

  const { data, error } = await supabase
    .from("mkt_signal" as never)
    .insert({
      idea_id: landing.idea_id,
      landing_id: landing.id,
      type,
      email,
      name: input.name?.trim() || null,
      quiz_answers: rawAnswers,
      icp_fit: icpFit,
      utm: input.utm ?? {},
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: (data as unknown as { id: string }).id };
}

export interface RecordEventInput {
  slug: string;
  type: string;
  sessionId?: string | null;
  utm?: Record<string, unknown>;
}

/** Event types the public beacon may write (intent gradient, not just views). */
const ALLOWED_EVENT_TYPES = new Set([
  "view",
  "click",
  "cta_click",
  "scroll_50",
  "scroll_90",
  "pricing_click",
  "meeting_booked",
]);

/** Record an analytics beacon event (best-effort; never throws). */
export async function recordEvent(
  input: RecordEventInput
): Promise<{ ok: boolean }> {
  try {
    if (!ALLOWED_EVENT_TYPES.has(input.type)) return { ok: false };
    const supabase = createServiceClient();
    const { data: landingRow } = await supabase
      .from("mkt_landing" as never)
      .select("id, idea_id")
      .eq("slug", input.slug)
      .maybeSingle();

    const landing = landingRow as unknown as {
      id: string;
      idea_id: string;
    } | null;
    if (!landing) return { ok: false };

    await supabase.from("mkt_event" as never).insert({
      idea_id: landing.idea_id,
      landing_id: landing.id,
      type: input.type.slice(0, 40),
      session_id: input.sessionId ?? null,
      utm: input.utm ?? {},
    } as never);

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
