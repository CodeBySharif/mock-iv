"use client";

import { AUTO_MODELS, LLM_PROVIDERS, type LlmProvider } from "@/lib/llm/types";
import { useSettingsStore } from "@/stores/settings-store";
import { useEffect, useState } from "react";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const geminiKey = useSettingsStore((s) => s.geminiKey);
  const openRouterKey = useSettingsStore((s) => s.openRouterKey);
  const groqKey = useSettingsStore((s) => s.groqKey);
  const setProvider = useSettingsStore((s) => s.setProvider);
  const setKeyForProvider = useSettingsStore((s) => s.setKeyForProvider);
  const clearKeys = useSettingsStore((s) => s.clearKeys);
  const activeKey = useSettingsStore((s) => s.activeKey);

  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!open) return null;

  const meta = LLM_PROVIDERS.find((p) => p.id === provider)!;
  const keyValue =
    provider === "gemini"
      ? geminiKey
      : provider === "openrouter"
        ? openRouterKey
        : groqKey;

  async function handleTest() {
    setTesting(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/prep/test-llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LLM-Provider": provider,
          "X-LLM-Key": activeKey(),
        },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        model?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Connection failed");
      }
      setTestMessage(`Connected · auto model ${data.model}`);
    } catch (e) {
      setTestMessage(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-lg rounded-[12px] border border-meet-border bg-meet-surface p-5 text-meet-text"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="settings-title" className="text-lg font-semibold">
              AI provider (BYOK)
            </h2>
            <p className="mt-1 text-sm text-meet-muted">
              Keys stay in this browser only. Model is fixed to auto / free —
              no manual model picker.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] bg-meet-border px-2.5 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-meet-muted">
              Provider
            </p>
            <div className="grid grid-cols-3 gap-2">
              {LLM_PROVIDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setProvider(item.id as LlmProvider);
                    setTestMessage(null);
                  }}
                  className={`rounded-[8px] border px-2 py-2 text-sm font-medium ${
                    provider === item.id
                      ? "border-brand bg-brand/15 text-meet-text"
                      : "border-meet-border text-meet-muted hover:text-meet-text"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-meet-muted">
              {meta.hint} · auto:{" "}
              <span className="font-mono text-meet-text/80">
                {AUTO_MODELS[provider]}
              </span>
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-meet-muted">
              {meta.label} API key
            </span>
            <input
              type="password"
              autoComplete="off"
              value={keyValue}
              onChange={(e) => setKeyForProvider(provider, e.target.value)}
              placeholder={meta.keyPlaceholder}
              className="w-full rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm text-meet-text outline-none focus:border-brand"
            />
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand hover:underline"
            >
              Get a {meta.label} key
            </a>
          </label>

          {testMessage ? (
            <p
              className={`text-sm ${
                testMessage.startsWith("Connected")
                  ? "text-brand"
                  : "text-amber-300"
              }`}
              role="status"
            >
              {testMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={clearKeys}
            className="rounded-[8px] px-3 py-2 text-sm text-meet-muted hover:text-meet-text"
          >
            Clear keys
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={testing || !keyValue}
              onClick={() => void handleTest()}
              className="rounded-[8px] border border-meet-border px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {testing ? "Testing…" : "Test connection"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
