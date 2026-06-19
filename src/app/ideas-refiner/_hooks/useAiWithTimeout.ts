/**
 * Utility: run an AI server-action call with a client-side timeout.
 * If the call exceeds 120 s, it resolves with a timeout error and shows a
 * toast recommending the user switch AI model.
 * The "Go to Settings" toast action opens the inline AI config modal
 * (registered by SandboxPlannerShell) instead of navigating away.
 */
import { toast } from "sonner";
import { openAiConfigModal } from "./aiConfigModalStore";

const AI_TIMEOUT_MS = 240_000; // 4 minutes — heavy prompts (e.g. Report) can exceed 2 min on slower models
export const TIMEOUT_TOAST_ID = "ai-timeout";

/** Toast shown when an AI call exceeds the timeout threshold. */
function showTimeoutToast() {
  toast.error("AI response timed out", {
    id: TIMEOUT_TOAST_ID,
    description:
      "The request took longer than 4 minutes. Try switching to a faster AI model " +
      "(e.g. Gemini 2.5 Flash) in Settings → AI Configuration.",
    duration: 12_000,
    action: {
      label: "Go to Settings",
      onClick: () => {
        openAiConfigModal();
      },
    },
  });
}

/** Toast shown when an AI call returns a non-timeout error. */
function showErrorToast(message: string) {
  toast.error("AI generation failed", {
    description:
      message +
      " — Try switching to a different AI model in Settings → AI Configuration.",
    duration: 10_000,
    action: {
      label: "Go to Settings",
      onClick: () => {
        openAiConfigModal();
      },
    },
  });
}

type TimedResult<T> = T & { _timedOut?: true };

/**
 * Options for runAiWithTimeout.
 * - `silent: true` — suppress both the timeout and error toasts.
 * - `timeoutMs` — override the default 4-minute timeout (e.g. 600_000 for long debate loops).
 */
interface RunAiOptions {
  silent?: boolean;
  timeoutMs?: number;
}

/**
 * Run `fn` with a client-side timeout (default 4 min, overridable via options.timeoutMs).
 * By default shows a toast on timeout or on error. Pass `{ silent: true }` to
 * suppress all toasts (for background auto-triggered calls).
 * Always returns a result object.
 */
export async function runAiWithTimeout<T extends { error?: string }>(
  fn: () => Promise<T>,
  options: RunAiOptions = {}
): Promise<T> {
  const { silent = false, timeoutMs = AI_TIMEOUT_MS } = options;
  let timedOut = false;

  const timeoutPromise = new Promise<TimedResult<T>>((resolve) =>
    setTimeout(() => {
      timedOut = true;
      if (!silent) showTimeoutToast();
      resolve({
        error: `AI response timed out after ${Math.round(timeoutMs / 60_000)} minutes.`,
        _timedOut: true,
      } as TimedResult<T>);
    }, timeoutMs)
  );

  const result = (await Promise.race([fn(), timeoutPromise])) as TimedResult<T>;

  if (!timedOut && result.error && !silent) {
    showErrorToast(result.error);
  }

  // Strip internal marker before returning
  const { _timedOut: _removed, ...clean } = result as TimedResult<T> & Record<string, unknown>;
  void _removed;
  return clean as T;
}
