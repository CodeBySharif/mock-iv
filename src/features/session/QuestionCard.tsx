"use client";

import { SECTION_LABELS, type InterviewTurn } from "@/types/interview";

type QuestionCardProps = {
  turn: InterviewTurn | null;
  thinkSecondsLeft: number;
  onReady: () => void;
};

export function QuestionCard({
  turn,
  thinkSecondsLeft,
  onReady,
}: QuestionCardProps) {
  if (!turn) {
    return (
      <div className="rounded-[8px] border border-meet-border bg-meet-surface p-4 text-meet-muted">
        Waiting for the next question
      </div>
    );
  }

  const thinking = turn.status === "thinking";

  return (
    <div
      key={turn.id}
      className="rounded-[8px] border border-meet-border bg-meet-surface p-4 text-meet-text"
    >
      <div className="mb-2 flex flex-wrap gap-2 text-xs text-meet-muted">
        <span>{SECTION_LABELS[turn.section]}</span>
        <span aria-hidden>·</span>
        <span>{turn.interviewerRole === "hr" ? "HR" : "Technical"}</span>
        <span aria-hidden>·</span>
        <span>Question {turn.index + 1}</span>
      </div>
      <p className="font-display text-lg font-medium leading-snug md:text-xl">
        {turn.questionText}
      </p>
      {thinking ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-meet-muted">
          <span className="font-mono tabular-nums">
            Think time {thinkSecondsLeft}s
          </span>
          <button
            type="button"
            onClick={onReady}
            className="rounded-[8px] bg-brand px-3 py-2 text-sm font-medium text-brand-foreground"
          >
            Ready to answer
          </button>
        </div>
      ) : null}
      {turn.status === "asking" ? (
        <p className="mt-3 text-sm text-meet-muted">Interviewer is asking</p>
      ) : null}
      {turn.status === "recording" ? (
        <p className="mt-3 text-sm text-record">Recording your answer</p>
      ) : null}
      {turn.status === "evaluating" ? (
        <p className="mt-3 text-sm text-meet-muted">Preparing feedback</p>
      ) : null}
    </div>
  );
}
