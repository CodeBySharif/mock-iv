"use client";

import { MasterCvButton } from "@/features/prep/MasterCvButton";
import { MasterCvModal } from "@/features/prep/MasterCvModal";
import { SettingsModal } from "@/features/settings/SettingsModal";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { useSettingsStore } from "@/stores/settings-store";
import Link from "next/link";
import { useEffect, useState } from "react";

const MODULES = [
  {
    id: "interrogation",
    title: "Interrogation room",
    body: "Ask questions; the model answers as you from your CV and role. Sessions and master CV live here — separate from prep.",
    href: "/interrogation",
    cta: "Open interrogation",
  },
  {
    id: "prep",
    title: "Interview prep",
    body: "Decode the role, predict questions, practice a live mock, then build a cheat sheet. Start here without interrogating first.",
    href: "/prep",
    cta: "Open prep",
  },
] as const;

export function HomeScreen() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const activeKey = useSettingsStore((s) => s.activeKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [masterCvOpen, setMasterCvOpen] = useState(false);
  const [keyReady, setKeyReady] = useState(false);

  useEffect(() => {
    hydrate();
    setKeyReady(Boolean(activeKey()));
  }, [hydrate, activeKey]);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-meet-bg text-meet-text">
      <header className="z-40 shrink-0 border-b border-meet-border bg-meet-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-meet-muted">
              Mock Interview
            </p>
            <h1 className="mt-1 font-display text-lg font-semibold sm:text-xl">
              Home
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <MasterCvButton onClick={() => setMasterCvOpen(true)} />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm font-medium hover:border-brand"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="meet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-6 max-w-2xl text-sm text-meet-muted">
          Two separate tracks. Interrogate your story first, or jump straight
          into prep.
        </p>

        {!keyReady ? (
          <p className="mb-6 rounded-[12px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Add an API key in Settings before either module can call the model.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((mod) => (
            <article
              key={mod.id}
              className="flex flex-col rounded-[12px] border border-meet-border bg-meet-surface p-6"
            >
              <h2 className="font-display text-xl font-semibold">{mod.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-meet-muted">
                {mod.body}
              </p>
              <Link
                href={mod.href}
                className="mt-6 inline-flex w-fit rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
              >
                {mod.cta} →
              </Link>
            </article>
          ))}
        </div>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MasterCvModal
        open={masterCvOpen}
        onClose={() => setMasterCvOpen(false)}
      />
    </div>
  );
}
