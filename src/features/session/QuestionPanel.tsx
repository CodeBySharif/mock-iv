"use client";

import { SECTION_LABELS, type InterviewTurn } from "@/types/interview";

type QuestionPanelProps = {
  phase: "greeting" | "questions";
  greetingText: string | null;
  turn: InterviewTurn | null;
  thinkSecondsLeft: number;
  answerSecondsLeft: number | null;
  introBudget: 30 | 60 | 120;
  onIntroBudgetChange: (seconds: 30 | 60 | 120) => void;
  feedback?: {
    tips?: string[];
    acknowledgment?: string;
  };
};

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuestionPanel({
  phase,
  greetingText,
  turn,
  thinkSecondsLeft,
  answerSecondsLeft,
  introBudget,
  onIntroBudgetChange,
  feedback,
}: QuestionPanelProps) {
  if (phase === "greeting") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-meet-border bg-meet-surface p-4">
        <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-meet-muted">
          Opening
        </p>
        <h2 className="mt-2 shrink-0 font-display text-lg font-semibold leading-snug text-meet-text md:text-xl">
          Welcome to the interview
        </h2>
        <p className="mt-3 min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed text-meet-muted">
          {greetingText ||
            "Alex is greeting you and introducing the interview panel."}
        </p>
        <p className="mt-3 shrink-0 text-xs text-meet-muted">
          Listen for a moment. Your timed self-intro comes next.
        </p>
      </div>
    );
  }

  if (!turn) {
    return (
      <div className="flex h-full min-h-0 items-center rounded-[12px] border border-meet-border bg-meet-surface p-4 text-meet-muted">
        Waiting for the next question
      </div>
    );
  }

  const isIntro = turn.questionId.startsWith("intro-timed");
  const thinking = turn.status === "thinking";
  const recording = turn.status === "recording";
  const paused = turn.status === "paused";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-meet-border bg-meet-surface p-4">
      <div className="flex shrink-0 flex-wrap gap-2 text-xs text-meet-muted">
        <span>{SECTION_LABELS[turn.section]}</span>
        <span aria-hidden>·</span>
        <span>{turn.interviewerRole === "hr" ? "HR" : "Technical"}</span>
        <span aria-hidden>·</span>
        <span>Question {turn.index + 1}</span>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        <h2 className="font-display text-lg font-semibold leading-snug text-meet-text md:text-xl">
          {turn.questionText}
        </h2>

        {isIntro && (thinking || recording || paused) ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-meet-muted">
              Pick an intro length to practice.
            </p>
            <div
              role="group"
              aria-label="Intro length"
              className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-meet-border"
            >
              {(
                [
                  [30, "30 sec"],
                  [60, "1 min"],
                  [120, "2 min"],
                ] as const
              ).map(([seconds, label]) => (
                <button
                  key={seconds}
                  type="button"
                  disabled={recording || paused}
                  onClick={() => onIntroBudgetChange(seconds)}
                  className={`px-2 py-2 text-sm disabled:opacity-40 ${
                    introBudget === seconds
                      ? "bg-brand text-brand-foreground"
                      : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {feedback?.acknowledgment ? (
          <p className="mt-3 text-sm text-meet-muted">{feedback.acknowledgment}</p>
        ) : null}

        {feedback?.tips?.length ? (
          <ul className="mt-3 space-y-2 border-t border-meet-border pt-3 text-sm leading-relaxed text-meet-text">
            {feedback.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-3 shrink-0 space-y-2 border-t border-meet-border pt-3">
        {turn.status === "asking" || turn.status === "acknowledgment" ? (
          <p className="text-sm text-meet-muted">Interviewer is speaking…</p>
        ) : null}

        {thinking ? (
          <span className="font-mono text-sm tabular-nums text-meet-muted">
            Think {formatClock(thinkSecondsLeft)}
          </span>
        ) : null}

        {recording && answerSecondsLeft !== null ? (
          <p className="font-mono text-sm tabular-nums text-record">
            Answer timer {formatClock(answerSecondsLeft)}
          </p>
        ) : null}

        {recording && answerSecondsLeft === null ? (
          <p className="text-sm text-record">Recording — Pause anytime to think</p>
        ) : null}

        {paused ? (
          <p className="text-sm text-amber-300">
            Paused
            {answerSecondsLeft !== null
              ? ` · ${formatClock(answerSecondsLeft)} left`
              : ""}
          </p>
        ) : null}

        {turn.status === "evaluating" ? (
          <p className="text-sm text-meet-muted">Preparing feedback…</p>
        ) : null}
      </div>
    </div>
  );
}
