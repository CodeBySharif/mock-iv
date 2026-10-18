"use client";

import {
  isStepReady,
  PREP_STEPS,
  type PrepStepId,
} from "@/features/prep/prep-steps";
import type { PrepPack } from "@/types/prep";
import Link from "next/link";

type PrepStepNavProps = {
  active: PrepStepId;
  pack?: PrepPack | null;
};

export function PrepStepNav({ active, pack }: PrepStepNavProps) {
  return (
    <nav
      aria-label="Prep steps"
      className="mb-5 flex flex-wrap gap-2 border-b border-meet-border pb-4"
    >
      {PREP_STEPS.map((step) => {
        const ready = isStepReady(pack, step.id);
        const isActive = step.id === active;
        const className = [
          "rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand text-brand-foreground"
            : ready
              ? "border border-meet-border text-meet-text hover:border-brand"
              : "border border-meet-border/50 text-meet-muted opacity-50",
        ].join(" ");

        if (!ready && !isActive) {
          return (
            <span key={step.id} className={className} aria-disabled>
              {step.number}. {step.title}
            </span>
          );
        }

        return (
          <Link
            key={step.id}
            href={step.href}
            aria-current={isActive ? "step" : undefined}
            className={className}
          >
            {step.number}. {step.title}
          </Link>
        );
      })}
    </nav>
  );
}
