"use client";

import { useThemeStore } from "@/stores/theme-store";
import { useEffect } from "react";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const hydrate = useThemeStore((s) => s.hydrate);
  const toggle = useThemeStore((s) => s.toggle);
  const hydrated = useThemeStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isDark = mode === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[8px] border border-meet-border bg-meet-bg text-meet-text hover:border-brand"
      >
        {hydrated ? (isDark ? <SunIcon /> : <MoonIcon />) : <SunIcon />}
      </button>

      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-meet-text px-2.5 py-1.5 text-xs font-medium text-meet-bg opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {isDark ? "Light mode" : "Dark mode"}
        <span
          aria-hidden
          className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-meet-text"
        />
      </span>
    </div>
  );
}
