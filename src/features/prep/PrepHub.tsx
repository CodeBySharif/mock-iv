"use client";

import { PrepShell } from "@/features/prep/PrepShell";
import {
  clearActivePack,
  clearAllLocalPracticeData,
  setActivePackId,
} from "@/features/prep/clear-local-data";
import { packOverviewHref } from "@/features/prep/prep-steps";
import { listPrepPacks } from "@/features/prep/storage";
import { getOrCreatePracticeId } from "@/lib/practice-id";
import { useSettingsStore } from "@/stores/settings-store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { PrepPack } from "@/types/prep";

const HUB_STEPS = [
  {
    id: "decode",
    title: "Decode the role",
    body: "Paste JD + company, upload CV, get day-to-day skills and gaps.",
    href: "/prep/decode?new=1",
  },
  {
    id: "predict",
    title: "Predict questions",
    body: "12 likely questions with fresher mistakes and strong answers.",
    href: "/prep/predict",
  },
  {
    id: "interview",
    title: "Interview practice",
    body: "Practice with your predicted questions using Talk / Pause / Submit.",
    href: "/lobby",
  },
  {
    id: "cheatsheet",
    title: "Cheat sheet",
    body: "Two-page, 10-minute read before the real interview.",
    href: "/prep/cheat-sheet",
  },
] as const;

export function PrepHub() {
  const router = useRouter();
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);
  const [history, setHistory] = useState<PrepPack[]>([]);
  const [keyReady, setKeyReady] = useState(false);
  const [clearedMsg, setClearedMsg] = useState<string | null>(null);

  function refresh() {
    setHistory(listPrepPacks().slice(0, 12));
  }

  useEffect(() => {
    getOrCreatePracticeId();
    hydrateSettings();
    clearActivePack();
    setHistory(listPrepPacks().slice(0, 12));
    setKeyReady(Boolean(activeKey()));
  }, [hydrateSettings, activeKey, provider]);

  const keysReady = useMemo(() => keyReady, [keyReady]);

  function startNewPrep() {
    clearActivePack();
    setClearedMsg(null);
    router.push("/prep/decode?new=1");
  }

  function openPack(item: PrepPack) {
    setActivePackId(item.id);
    router.push(packOverviewHref(item.id));
  }

  function handleClearAll() {
    const ok = window.confirm(
      "Clear all local prep packs, interview sessions, and reports? API keys in Settings are kept. This cannot be undone.",
    );
    if (!ok) return;
    const n = clearAllLocalPracticeData();
    setHistory([]);
    setClearedMsg(`Cleared ${n} local keys. Start a new decode to retest.`);
  }

  return (
    <PrepShell
      title="Interview prep"
      subtitle="Decode → Predict → Practice → Cheat sheet"
      sectionHref="/prep"
      sectionLabel="Prep"
    >
      {!keysReady ? (
        <p className="mb-4 rounded-[12px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Add your Gemini and OpenRouter keys in Settings before running decode
          or interview rounds.
        </p>
      ) : null}

      {clearedMsg ? (
        <p className="mb-4 rounded-[12px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-meet-text">
          {clearedMsg}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-meet-muted">
          Start a new prep, or open a past pack to see every step, redo interview,
          or view reports.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startNewPrep}
            className="rounded-[8px] bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
          >
            Start new prep
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-[8px] border border-meet-border px-3 py-2 text-sm text-meet-muted hover:text-meet-text"
          >
            Clear all local data
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {HUB_STEPS.map((step, index) => (
          <div
            key={step.id}
            className="rounded-[12px] border border-meet-border bg-meet-surface p-5"
          >
            <p className="text-xs uppercase tracking-wide text-meet-muted">
              Step {index + 1}
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-meet-muted">
              {step.body}
            </p>
            <p className="mt-4 text-xs text-meet-muted">
              {index === 0
                ? "Available for a new session."
                : "Unlock by opening a past pack or finishing earlier steps."}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={startNewPrep}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
        >
          Begin with Decode →
        </button>
      </div>

      <div className="mt-8 border-t border-meet-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Past prep packs</h2>
          <button
            type="button"
            onClick={refresh}
            className="text-sm text-meet-muted hover:text-meet-text"
          >
            Refresh
          </button>
        </div>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-meet-muted">
            No packs yet. Start new prep to create one.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openPack(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-meet-border bg-meet-surface px-4 py-3 text-left hover:border-brand"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {item.roleTitle} · {item.companyName}
                    </span>
                    <span className="block truncate text-xs text-meet-muted">
                      {new Date(item.createdAt).toLocaleString()} · {item.status}
                      {item.experienceLevel
                        ? ` · ${item.experienceLevel}`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-brand">
                    Open pack
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </PrepShell>
  );
}
