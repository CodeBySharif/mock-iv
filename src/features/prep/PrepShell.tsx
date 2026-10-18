"use client";

import { MasterCvButton } from "@/features/prep/MasterCvButton";
import { MasterCvModal } from "@/features/prep/MasterCvModal";
import { packOverviewHref, type PrepStepId } from "@/features/prep/prep-steps";
import { SettingsModal } from "@/features/settings/SettingsModal";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import type { PrepPack } from "@/types/prep";
import Link from "next/link";
import { useState } from "react";

type PrepShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** @deprecated Step rail removed — kept for call-site compat. */
  activeStep?: PrepStepId;
  pack?: PrepPack | null;
  /** @deprecated Step rail removed. */
  showStepNav?: boolean;
  /** Middle crumb when not on home. */
  sectionHref?: string;
  sectionLabel?: string;
  /** When false, body does not scroll (child manages its own pane). */
  bodyScroll?: boolean;
  /** Extra header actions before Master CV / Settings. */
  headerActions?: React.ReactNode;
};

export function PrepShell({
  children,
  title,
  subtitle,
  pack,
  sectionHref = "/prep",
  sectionLabel = "Prep",
  bodyScroll = true,
  headerActions,
}: PrepShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [masterCvOpen, setMasterCvOpen] = useState(false);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-meet-bg text-meet-text">
      <header className="z-40 shrink-0 border-b border-meet-border bg-meet-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Link
                href="/"
                className="font-medium text-meet-text hover:underline"
              >
                Home
              </Link>
              <span className="text-meet-muted" aria-hidden>
                /
              </span>
              <Link
                href={sectionHref}
                className="text-meet-muted hover:text-meet-text hover:underline"
              >
                {sectionLabel}
              </Link>
              {pack ? (
                <>
                  <span className="text-meet-muted" aria-hidden>
                    /
                  </span>
                  <Link
                    href={packOverviewHref(pack.id)}
                    className="truncate text-meet-muted hover:text-meet-text hover:underline"
                  >
                    {pack.roleTitle}
                  </Link>
                </>
              ) : null}
            </div>
            {title ? (
              <h1 className="mt-1 truncate font-display text-lg font-semibold sm:text-xl">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="truncate text-xs text-meet-muted sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {pack ? (
              <Link
                href={packOverviewHref(pack.id)}
                className="rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm font-medium hover:border-brand"
              >
                Pack
              </Link>
            ) : null}
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
      <main
        className={
          bodyScroll
            ? "meet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8"
            : "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MasterCvModal
        open={masterCvOpen}
        onClose={() => setMasterCvOpen(false)}
      />
    </div>
  );
}
