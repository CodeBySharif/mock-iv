"use client";

type TranscriptPanelProps = {
  text: string;
  recording: boolean;
  paused?: boolean;
  elapsedSeconds?: number;
  canSubmit?: boolean;
  onSubmit?: () => void;
};

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TranscriptPanel({
  text,
  recording,
  paused = false,
  elapsedSeconds = 0,
  canSubmit = false,
  onSubmit,
}: TranscriptPanelProps) {
  const placeholder = recording
    ? "Listening…"
    : paused
      ? "Paused — tap Talk to answer to continue, or Submit when ready."
      : "Your spoken answer will appear here as you talk.";

  const showTimer = recording || paused || elapsedSeconds > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-meet-border bg-meet-surface p-4">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-meet-muted">
          Your response
          {recording ? (
            <span className="ml-2 text-record">Recording</span>
          ) : null}
          {paused ? (
            <span className="ml-2 text-amber-300">Paused</span>
          ) : null}
        </p>
        {showTimer ? (
          <p
            className={`font-mono text-sm tabular-nums ${
              recording ? "text-record" : paused ? "text-amber-300" : "text-meet-muted"
            }`}
            aria-label="Answer duration"
          >
            {formatClock(elapsedSeconds)}
          </p>
        ) : null}
      </div>
      <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-meet-text">
        {text || placeholder}
      </p>
      <div className="mt-3 flex shrink-0 justify-end border-t border-meet-border pt-3">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
