"use client";

import type { DeliveryMetrics } from "@/types/interview";

type FeedbackCardProps = {
  tips?: string[];
  metrics?: DeliveryMetrics;
  acknowledgment?: string;
  tone?: "dark" | "light";
};

export function FeedbackCard({
  tips,
  metrics,
  acknowledgment,
  tone = "dark",
}: FeedbackCardProps) {
  if (!tips?.length && !metrics) return null;

  const dark = tone === "dark";

  return (
    <div
      className={`rounded-[8px] border p-4 ${
        dark
          ? "border-meet-border bg-meet-surface text-meet-text"
          : "border-border bg-surface text-foreground"
      }`}
    >
      <p
        className={`mb-2 text-xs font-medium uppercase tracking-wide ${
          dark ? "text-meet-muted" : "text-muted"
        }`}
      >
        Delivery feedback
      </p>
      {acknowledgment ? (
        <p className={`mb-3 text-sm ${dark ? "text-meet-muted" : "text-muted"}`}>
          {acknowledgment}
        </p>
      ) : null}
      {metrics ? (
        <div className="mb-3 flex flex-wrap gap-2 font-mono text-xs">
          <span
            className={`rounded-[6px] px-2 py-1 ${
              dark ? "bg-black/30 text-meet-text" : "bg-background text-foreground"
            }`}
          >
            {Math.floor(metrics.durationMs / 1000 / 60)}:
            {String(Math.floor((metrics.durationMs / 1000) % 60)).padStart(2, "0")}{" "}
            answer
          </span>
          <span
            className={`rounded-[6px] px-2 py-1 ${
              dark ? "bg-black/30 text-meet-text" : "bg-background text-foreground"
            }`}
          >
            {metrics.wordsPerMinute} WPM
          </span>
          <span
            className={`rounded-[6px] px-2 py-1 ${
              dark ? "bg-black/30 text-meet-text" : "bg-background text-foreground"
            }`}
          >
            {metrics.fillerCount} fillers
          </span>
          <span
            className={`rounded-[6px] px-2 py-1 ${
              dark ? "bg-black/30 text-meet-text" : "bg-background text-foreground"
            }`}
          >
            clarity {metrics.clarityProxyScore ?? "—"}
          </span>
        </div>
      ) : null}
      <ul className="space-y-2 text-sm leading-relaxed">
        {tips?.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
