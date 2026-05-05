/**
 * Module-level store for the inline AI Configuration modal.
 *
 * Because the toast in useAiWithTimeout runs outside React's component tree,
 * it cannot call setState directly. This tiny module acts as a bridge:
 *  1. SandboxPlannerShell registers its open callback via registerOpenAiConfigModal.
 *  2. useAiWithTimeout calls openAiConfigModal() instead of navigating to /settings.
 */

let _openModal: (() => void) | null = null;

/** Register the function that opens the AI config modal. Called from SandboxPlannerShell. */
export function registerOpenAiConfigModal(fn: () => void): void {
  _openModal = fn;
}

/** Open the inline AI config modal (no-op if no shell is mounted). */
export function openAiConfigModal(): void {
  _openModal?.();
}
