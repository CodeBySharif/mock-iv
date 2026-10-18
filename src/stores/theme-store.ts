"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "mock-iv:theme";

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => void;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

function applyDom(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "dark",
  hydrated: false,
  hydrate: () => {
    const mode = readStoredTheme();
    applyDom(mode);
    set({ mode, hydrated: true });
  },
  setMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    applyDom(mode);
    set({ mode });
  },
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    get().setMode(next);
  },
}));
