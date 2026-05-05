/**
 * ThemeScript — inline script injected into `<head>` so the theme class
 * lands on `<html>` BEFORE the first paint.
 *
 * Without this we'd see a flash of dark theme on a system that prefers
 * light (or vice-versa). The script:
 *   1. Reads `localStorage.getItem("blur-theme")` → "light" | "dark" | "system" | null
 *   2. Falls back to `system` (which respects `prefers-color-scheme`)
 *   3. Sets `document.documentElement.classList` to either `light` or `dark`
 *
 * The actual class application — same logic that runs on user toggle —
 * lives in `ThemeProvider`. This script is the SSR-safe pre-hydration
 * mirror of that logic.
 */

const SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("blur-theme");
    var pref = stored === "light" || stored === "dark" ? stored : null;
    if (!pref) {
      pref = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(pref);
    root.style.colorScheme = pref;
  } catch (e) {
    /* localStorage may throw in private mode — fall back to dark. */
    document.documentElement.classList.add("dark");
  }
})();
`.trim();

export default function ThemeScript() {
  return (
    <script
      // The script runs synchronously in <head>, before any React hydration.
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
