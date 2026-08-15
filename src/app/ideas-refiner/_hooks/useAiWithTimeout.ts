/**
 * Utility: run an AI server-action call with a client-side timeout.
 *
 * The timeout is NOT surfaced to the user: a slow call usually means the
 * server-side generation is still running (it completes later via Realtime),
 * so a "timed out" alert would be misleading. On timeout we simply resolve
 * with a non-error marker and let the loading overlay keep tracking the real
 * server state. An alert is shown ONLY when the AI API genuinely returns an error.
 */
import { toast } from "sonner";
import { openAiConfigModal } from "./aiConfigModalStore";

const AI_TIMEOUT_MS = 240_000; // 4 minutes — heavy prompts (e.g. Report) can exceed 2 min on slower models

/** Toast shown when an AI call returns a non-timeout error. */
function showErrorToast(message: string) {
  toast.error("AI generation failed", {
    description: message + " — Try switching to a different AI model.",
    duration: 10_000,
    action: {
      label: "Change model",
      onClick: () => {
        openAiConfigModal();
      },
    },
  });
}

type TimedResult<T> = T & { _timedOut?: true };

/**
 * Options for runAiWithTimeout.
 * - `silent: true` — suppress the error toast (for background auto-triggered calls).
 * - `timeoutMs` — override the default 4-minute timeout (e.g. 600_000 for long debate loops).
 */
interface RunAiOptions {
  silent?: boolean;
  timeoutMs?: number;
}

/**
 * Run `fn` with a client-side timeout (default 4 min, overridable via options.timeoutMs).
 * Shows a toast ONLY when the AI API returns a genuine error — a timeout resolves
 * silently with a non-error marker (the server is likely still working). Pass
 * `{ silent: true }` to suppress the error toast too (background auto-triggered calls).
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
      // No toast and no error on timeout — the server-side generation is likely
      // still running and will resolve via Realtime. Surfacing a "timed out"
      // alert here would be misleading. Resolve with a non-error marker so the
      // caller stops its local spinner without showing an error.
      resolve({ _timedOut: true } as TimedResult<T>);
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
