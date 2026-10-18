"use client";

import type { LlmProvider } from "@/lib/llm/types";
import { create } from "zustand";

const KEYS = {
  provider: "mock-iv:byok:provider",
  gemini: "mock-iv:byok:gemini",
  openRouter: "mock-iv:byok:openrouter",
  groq: "mock-iv:byok:groq",
} as const;

type SettingsState = {
  provider: LlmProvider;
  geminiKey: string;
  openRouterKey: string;
  groqKey: string;
  hydrated: boolean;
  hydrate: () => void;
  setProvider: (provider: LlmProvider) => void;
  setKeyForProvider: (provider: LlmProvider, key: string) => void;
  clearKeys: () => void;
  activeKey: () => string;
};

function read(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

function cleanKey(key: string) {
  let cleaned = key.trim().replace(/^["']|["']$/g, "");
  if (/^bearer\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^bearer\s+/i, "").trim();
  }
  return cleaned;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: "gemini",
  geminiKey: "",
  openRouterKey: "",
  groqKey: "",
  hydrated: false,

  hydrate: () => {
    const providerRaw = read(KEYS.provider, "gemini");
    const provider = (
      ["gemini", "openrouter", "groq"].includes(providerRaw)
        ? providerRaw
        : "gemini"
    ) as LlmProvider;
    set({
      provider,
      geminiKey: read(KEYS.gemini),
      openRouterKey: read(KEYS.openRouter),
      groqKey: read(KEYS.groq),
      hydrated: true,
    });
  },

  setProvider: (provider) => {
    write(KEYS.provider, provider);
    set({ provider });
  },

  setKeyForProvider: (provider, key) => {
    const cleaned = cleanKey(key);
    if (provider === "gemini") {
      write(KEYS.gemini, cleaned);
      set({ geminiKey: cleaned });
      return;
    }
    if (provider === "openrouter") {
      write(KEYS.openRouter, cleaned);
      set({ openRouterKey: cleaned });
      return;
    }
    write(KEYS.groq, cleaned);
    set({ groqKey: cleaned });
  },

  clearKeys: () => {
    write(KEYS.gemini, "");
    write(KEYS.openRouter, "");
    write(KEYS.groq, "");
    set({ geminiKey: "", openRouterKey: "", groqKey: "" });
  },

  activeKey: () => {
    const state = get();
    if (state.provider === "gemini") return state.geminiKey;
    if (state.provider === "openrouter") return state.openRouterKey;
    return state.groqKey;
  },
}));
