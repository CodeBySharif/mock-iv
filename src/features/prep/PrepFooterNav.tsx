"use client";

import {
  isStepReady,
  nextStepAfter,
  packOverviewHref,
  prevStepBefore,
  type PrepStepId,
} from "@/features/prep/prep-steps";
import type { PrepPack } from "@/types/prep";
import Link from "next/link";

type PrepFooterNavProps = {
  step: PrepStepId;
  pack?: PrepPack | null;
  /** Extra primary actions on the right (e.g. Run decode). */
  primary?: React.ReactNode;
  hint?: string;
};

export function PrepFooterNav({
  step,
  pack,
  primary,
  hint,
}: PrepFooterNavProps) {
  const prev = prevStepBefore(step);
  const next = nextStepAfter(step);
  const nextReady = next ? isStepReady(pack, next.id) : false;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-meet-border bg-meet-surface/95 backdrop-blur">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-[8px] border border-meet-border px-3 py-2 text-sm font-medium"
          >
            Home
          </Link>
          {pack ? (
            <Link
              href={packOverviewHref(pack.id)}
              className="rounded-[8px] border border-meet-border px-3 py-2 text-sm font-medium"
            >
              Pack overview
            </Link>
          ) : null}
          {prev ? (
            <Link
              href={prev.href}
              className="rounded-[8px] border border-meet-border px-3 py-2 text-sm font-medium"
            >
              ← {prev.title}
            </Link>
          ) : null}
          {hint ? (
            <p className="hidden text-xs text-meet-muted sm:block sm:text-sm">
              {hint}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {primary}
          {next ? (
            nextReady ? (
              <Link
                href={next.href}
                className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
              >
                Next: {next.title} →
              </Link>
            ) : (
              <span className="rounded-[8px] bg-meet-border px-4 py-2.5 text-sm font-medium text-meet-muted opacity-60">
                Next: {next.title}
              </span>
            )
          ) : (
            <Link
              href="/"
              className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              Done · Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
