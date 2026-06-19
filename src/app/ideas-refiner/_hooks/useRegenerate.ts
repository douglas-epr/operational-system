"use client";

/**
 * useRegenerate — shared regeneration state for all Sandbox Planner steps.
 *
 * Key behavior: clears isRegenerating as soon as Supabase Realtime fires
 * (isAiWorking transitions true→false), NOT when the server-action HTTP
 * response arrives. This makes new content visible immediately — the user
 * should never have to wait for the full round-trip after Claude responds.
 */

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { IdeaBlock } from "@/types/idea-refiner";
import { runAiWithTimeout, TIMEOUT_TOAST_ID } from "./useAiWithTimeout";
import { clearAutoTriggerGuard } from "./useAutoTriggerAi";

export function useRegenerate(
  ideaId: string,
  step: IdeaBlock,
  isAiWorking: boolean,
) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks that isAiWorking was seen as true during this regeneration cycle,
  // so we only clear isRegenerating on the true→false edge, not on the initial
  // false→false state before the DB flag is set.
  const hadAiWorkingRef = useRef(false);

  useEffect(() => {
    if (isAiWorking && isRegenerating) {
      hadAiWorkingRef.current = true;
    }
    if (!isAiWorking && hadAiWorkingRef.current && isRegenerating) {
      hadAiWorkingRef.current = false;
      setIsRegenerating(false);
      // AI completed via Realtime — dismiss any stale timeout toast
      toast.dismiss(TIMEOUT_TOAST_ID);
    }
  }, [isAiWorking, isRegenerating]);

  async function triggerRegenerate(action: () => Promise<{ error?: string }>) {
    setIsRegenerating(true);
    setError(null);
    clearAutoTriggerGuard(ideaId, step);
    // risk_and_validation runs the multi-call Devil's Advocate debate loop (up to
    // 10 rounds × 2 sides × 2 gates ≈ 40 sequential calls) PLUS the risk/validation
    // + demand-evidence synthesis call — give it a 45-min ceiling so the "timed out"
    // toast never fires mid-debate. report now only does reframer + scorer but keeps
    // the long ceiling for safety. strategic_frameworks loops per-ICP — 10 min is
    // plenty. (isRegenerating also clears on the Realtime edge, so this timeout
    // mainly governs the error toast.)
    const debateTimeoutMs =
      step === "risk_and_validation" || step === "report" ? 2_700_000 : undefined;
    const frameworksTimeoutMs = step === "strategic_frameworks" ? 600_000 : undefined;
    const result = await runAiWithTimeout(action, {
      timeoutMs: debateTimeoutMs ?? frameworksTimeoutMs,
    });
    // Fallback: clear if Realtime didn't already do so.
    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  return { isRegenerating, error, setError, triggerRegenerate };
}
