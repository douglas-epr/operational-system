"use client";

/**
 * Sidebar collapse / expand state — single source of truth for the chrome.
 *
 *   const { pinned, hovered, expanded, togglePin, setHovered } = useSidebar();
 *
 * Two independent states drive the UI:
 *
 *   - `pinned`  — user clicked the toggle icon; sidebar stays expanded and
 *                 reserves 232 px of layout space (main column shifts).
 *                 Persists in localStorage (`blur:sidebar-pinned`).
 *   - `hovered` — transient mouse-over state; expands the sidebar visually
 *                 as an OVERLAY on top of the main content. The main column
 *                 does NOT reflow on hover.
 *
 * `expanded = pinned || hovered` — every render pulls this for display.
 *
 * The CSS variable `--sidebar-width` reflects only the LAYOUT width
 * (60 px collapsed / 232 px pinned). When the user is hovering an
 * unpinned sidebar, the width var stays at 60 px and the <aside> element
 * itself widens via inline style + z-index overlay.
 */

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarState {
  pinned: boolean;
  hovered: boolean;
  /** True when the sidebar should display its expanded layout (icons + labels). */
  expanded: boolean;
  togglePin: () => void;
  setHovered: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

const STORAGE_KEY = "blur:sidebar-pinned";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [pinned, setPinnedState] = useState<boolean>(false);
  const [hovered, setHovered] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  // Pull persisted pin preference on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1" || stored === "0") {
        setPinnedState(stored === "1");
      }
    } catch {
      /* ignore — private mode etc. */
    }
    setHydrated(true);
  }, []);

  function setPinned(v: boolean) {
    setPinnedState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
  const togglePin = () => setPinned(!pinned);

  // Drive the LAYOUT width via the CSS variable — only the pinned state
  // contributes here. Hover is a visual overlay, not a layout shift.
  useEffect(() => {
    if (!hydrated) return;
    const w = pinned ? "232px" : "60px";
    document.documentElement.style.setProperty("--sidebar-width", w);
  }, [pinned, hydrated]);

  const expanded = pinned || hovered;

  return (
    <SidebarContext.Provider
      value={{ pinned, hovered, expanded, togglePin, setHovered }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return {
      pinned: false,
      hovered: false,
      expanded: false,
      togglePin: () => {},
      setHovered: () => {},
    };
  }
  return ctx;
}
