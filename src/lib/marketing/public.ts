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
import type { MktLanding, MktSignalType } from "@/types/marketing";

/** A published landing page, joined with its project name for rendering. */
export interface PublicLanding extends MktLanding {
  project_name: string | null;
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

  const { data: project } = await supabase
    .from("project")
    .select("name")
    .eq("id", landing.project_id)
    .maybeSingle();

  return {
    ...landing,
    project_name: (project as { name: string | null } | null)?.name ?? null,
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
 * webhook once that integration is switched on. We hard-reject it so a stubbed
 * UI can't write an unpaid "preorder" row.
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

  // Resolve the landing + verify the stage is enabled on a published page.
  const { data: landingRow } = await supabase
    .from("mkt_landing" as never)
    .select("id, project_id, capture_stages, published")
    .eq("slug", slug)
    .maybeSingle();

  const landing = landingRow as unknown as {
    id: string;
    project_id: string;
    capture_stages: string[];
    published: boolean;
  } | null;

  if (!landing || !landing.published) {
    return { error: "This page is not accepting submissions." };
  }
  if (!landing.capture_stages?.includes(type)) {
    return { error: "This submission type is not enabled on this page." };
  }

  const { data, error } = await supabase
    .from("mkt_signal" as never)
    .insert({
      project_id: landing.project_id,
      landing_id: landing.id,
      type,
      email,
      name: input.name?.trim() || null,
      quiz_answers: input.quizAnswers ?? {},
      utm: input.utm ?? {},
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: (data as unknown as { id: string }).id };
}

export interface RecordEventInput {
  slug: string;
  type: string; // "view" | "click" | "cta" | ...
  sessionId?: string | null;
  utm?: Record<string, unknown>;
}

/** Record an analytics beacon event (best-effort; never throws). */
export async function recordEvent(
  input: RecordEventInput
): Promise<{ ok: boolean }> {
  try {
    const supabase = createServiceClient();
    const { data: landingRow } = await supabase
      .from("mkt_landing" as never)
      .select("id, project_id")
      .eq("slug", input.slug)
      .maybeSingle();

    const landing = landingRow as unknown as {
      id: string;
      project_id: string;
    } | null;
    if (!landing) return { ok: false };

    await supabase.from("mkt_event" as never).insert({
      project_id: landing.project_id,
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
