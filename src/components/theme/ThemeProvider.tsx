"use client";

/**
 * ThemeProvider — client-side theme state for the segmented Light/Dark/System
 * toggle that lives in the Sidebar profile popover.
 *
 *   const { theme, resolvedTheme, setTheme } = useTheme();
 *   //  theme:         "light" | "dark" | "system"  — what the user picked
 *   //  resolvedTheme: "light" | "dark"             — what's actually applied
 *
 * Persistence is localStorage-only for v1 (key: "move37-theme"). The pre-paint
 * `ThemeScript` already applied the right class — this provider keeps it in
 * sync when the user toggles, and listens for OS theme changes when in
 * "system" mode.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeChoice = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "move37-theme";

function readStored(): ThemeChoice {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* private mode etc. */
  }
  return "dark";
}

function applyClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export default function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeChoice;
}) {
  const [theme, setThemeState] = useState<ThemeChoice>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // Hydrate from DB-supplied initial value or localStorage on mount.
  useEffect(() => {
    const stored = initialTheme ?? readStored();
    setThemeState(stored);
    setResolvedTheme(stored);
    applyClass(stored);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setResolvedTheme(next);
    applyClass(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Defensive default so `<Sidebar>` doesn't crash if rendered outside
    // the provider (e.g. in a test that doesn't wrap it). System pref +
    // a no-op setter is the safest fallback.
    return {
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: () => {},
    };
  }
  return ctx;
}
