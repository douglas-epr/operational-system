/**
 * useAutoTriggerAi
 * ------------------------------------------------------------------
 * Auto-trigger AI generation the first time a user opens an empty
 * Sandbox Planner step. Idempotent via a useRef + sessionStorage guard
 * keyed by (ideaId, step) so navigating away and back in the same
 * session will not re-fire.
 *
 * A 1-second delay is intentional: it ensures the Supabase Realtime
 * channel in SandboxPlannerShell has time to subscribe before the AI
 * trigger sets current_blocks_updating in the DB. Without this delay,
 * the channel may miss the DB change event and never call router.refresh().
 */
"use client";

import { useEffect, useRef } from "react";
import { triggerAiGeneration } from "@/app/idea-refiner/actions";
import { runAiWithTimeout } from "./useAiWithTimeout";
import type { IdeaBlock } from "@/types/idea-refiner";

const REALTIME_DELAY_MS = 1_000; // 1 s — ensures Realtime channel is subscribed

const storageKey = (ideaId: string, step: IdeaBlock) =>
  `sbx-ai-autotrigger:${ideaId}:${step}`;

export function useAutoTriggerAi(
  ideaId: string,
  step: IdeaBlock,
  isEmpty: boolean,
  isAiWorking: boolean,
) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    if (!isEmpty || isAiWorking) return;
    if (typeof window === "undefined") return;
    const key = storageKey(ideaId, step);
    if (window.sessionStorage.getItem(key) === "1") return;

    // Delay so the Supabase Realtime channel is connected before AI starts.
    // Auto-triggers run with `silent: true` so a transient provider error in a
    // background call doesn't flash an error toast on top of data that may
    // already be saved from an earlier successful run. The user can click
    // Regenerate manually — which is NOT silent — if they suspect a failure.
    const timer = setTimeout(() => {
      firedRef.current = true;
      window.sessionStorage.setItem(key, "1");
      void runAiWithTimeout(() => triggerAiGeneration(ideaId, step), { silent: true });
    }, REALTIME_DELAY_MS);

    return () => clearTimeout(timer);
  }, [ideaId, step, isEmpty, isAiWorking]);
}

/** Clear the auto-trigger guard for a step (call on explicit Regenerate). */
export function clearAutoTriggerGuard(ideaId: string, step: IdeaBlock) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(storageKey(ideaId, step));
}

/** Utility: treat HTML that contains only whitespace/empty tags as blank. */
export function isBlankHtml(s: string | null | undefined): boolean {
  if (!s) return true;
  return s.replace(/<[^>]*>/g, "").trim().length === 0;
}
