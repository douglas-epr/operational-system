"use client";

import { useEffect } from "react";
import { SunIcon, MoonIcon } from "@/components/ui/icons";
import { useTheme, type ThemeChoice } from "@/components/theme/ThemeProvider";
import { saveTheme } from "../actions";

const OPTIONS: Array<{ id: ThemeChoice; label: string; Icon: typeof SunIcon; hint: string }> = [
  { id: "light", label: "Light", Icon: SunIcon,  hint: "Always use the light theme." },
  { id: "dark",  label: "Dark",  Icon: MoonIcon, hint: "Always use the dark theme." },
];

interface ThemePickerProps {
  initialTheme?: ThemeChoice;
}

export default function ThemePicker({ initialTheme }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();

  // Seed from DB value on mount (cross-device sync).
  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(id: ThemeChoice) {
    setTheme(id);
    saveTheme(id);
  }

  return (
    <div className="grid grid-cols-2 gap-2 max-w-xs">
      {OPTIONS.map(({ id, label, Icon, hint }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            aria-pressed={active}
            title={hint}
            className={[
              "flex flex-col items-center gap-1.5 px-3 py-3 rounded-md border text-[12px] font-medium transition-colors",
              active
                ? "border-accent bg-accent-subtle text-text-primary"
                : "border-border bg-elevated text-text-secondary hover:text-text-primary hover:bg-muted",
            ].join(" ")}
          >
            <Icon
              className={["w-4 h-4", active ? "text-accent" : "text-text-muted"].join(" ")}
              strokeWidth={1.8}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
