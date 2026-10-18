"use client";

import { useEffect, useState } from "react";

type WorkingOverlayProps = {
  open: boolean;
  title: string;
  hint?: string;
};

export function WorkingOverlay({ open, title, hint }: WorkingOverlayProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!open) {
      setSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="working-title"
    >
      <div className="w-full max-w-md rounded-[12px] border border-meet-border bg-meet-surface p-6 text-meet-text shadow-xl">
        <h2 id="working-title" className="font-display text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-meet-muted">
          {hint || "Stay on this page until it finishes."}
        </p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-meet-border">
          <div className="meet-progress-bar h-full w-1/3 rounded-full bg-brand" />
        </div>
        <p className="mt-3 font-mono text-sm tabular-nums text-meet-muted">
          Working… {seconds}s
        </p>
        <p className="mt-1 text-xs text-meet-muted">
          Typical wait: 15–60 seconds depending on the model.
        </p>
      </div>
    </div>
  );
}
