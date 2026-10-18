"use client";

import {
  answerLengthGuidance,
  introTargetCopy,
} from "@/features/coaching/answer-guidance";
import { SECTION_LABELS, type InterviewTurn } from "@/types/interview";
import { useState } from "react";

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
        <p className="meet-scroll mt-3 min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed text-meet-muted">
          {greetingText ||
            "Alex is greeting you and introducing the interview panel."}
        </p>
        <p className="mt-3 shrink-0 text-xs text-meet-muted">
          Listen for a moment. Your timed self-intro comes next — you can pick
          30 sec, 1 min, or 2 min.
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
  const answering = thinking || recording || paused;
  const lengthGuide = answerLengthGuidance(turn.section, isIntro);
  const introGuide = isIntro ? introTargetCopy(introBudget) : null;
  const showCoach =
    answering && (isIntro || turn.checking || turn.strongAnswer || lengthGuide);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-meet-border bg-meet-surface p-4">
      <div className="flex shrink-0 flex-wrap gap-2 text-xs text-meet-muted">
        <span>{SECTION_LABELS[turn.section]}</span>
        <span aria-hidden>·</span>
        <span>{turn.interviewerRole === "hr" ? "HR" : "Technical"}</span>
        <span aria-hidden>·</span>
        <span>Question {turn.index + 1}</span>
        {lengthGuide?.useStar ? (
          <>
            <span aria-hidden>·</span>
            <span className="text-brand">STAR</span>
          </>
        ) : null}
      </div>

      <div className="meet-scroll mt-2 min-h-0 flex-1 overflow-y-auto">
        <h2 className="font-display text-lg font-semibold leading-snug text-meet-text md:text-xl">
          {turn.questionText}
        </h2>

        {isIntro && answering ? (
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
            {introGuide ? (
              <p className="text-xs leading-relaxed text-meet-muted">
                {introGuide.guidance}
              </p>
            ) : null}
          </div>
        ) : null}

        {lengthGuide && answering && !isIntro ? (
          <p className="mt-3 rounded-[8px] border border-meet-border/80 bg-meet-bg px-3 py-2 text-xs leading-relaxed text-meet-muted">
            {lengthGuide.line}
          </p>
        ) : null}

        {showCoach ? (
          <CoachAssist
            key={isIntro ? `intro-${introBudget}-${turn.strongAnswer?.slice(0, 24) ?? ""}` : turn.id}
            isIntro={isIntro}
            checking={turn.checking}
            fresherMistake={turn.fresherMistake}
            strongAnswer={turn.strongAnswer}
            useStar={!!lengthGuide?.useStar}
          />
        ) : null}

        {typeof turn.score === "number" &&
        (turn.status === "feedback" ||
          turn.status === "acknowledgment" ||
          turn.status === "evaluating" ||
          turn.status === "done") ? (
          <p className="mt-3 text-sm font-semibold text-brand">
            Score {turn.score}/10
            {turn.scoreNote ? (
              <span className="ml-2 font-normal text-meet-muted">
                — {turn.scoreNote}
              </span>
            ) : null}
          </p>
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
          <p className="text-sm text-record">
            Recording — Hint/Answer stay open · Pause anytime
          </p>
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

function CoachAssist({
  isIntro,
  checking,
  fresherMistake,
  strongAnswer,
  useStar,
}: {
  isIntro: boolean;
  checking?: string;
  fresherMistake?: string;
  strongAnswer?: string;
  useStar: boolean;
}) {
  // Intro practice: open on Your intro so you can read/speak the real script.
  const [tab, setTab] = useState<"hint" | "answer">(
    isIntro ? "answer" : "hint",
  );

  return (
    <div className="mt-3 rounded-[8px] border border-meet-border bg-meet-bg text-sm">
      <div
        role="tablist"
        aria-label="Coach assist"
        className="grid grid-cols-2 border-b border-meet-border"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "hint"}
          onClick={() => setTab("hint")}
          className={`px-3 py-2 text-xs font-medium uppercase tracking-wide ${
            tab === "hint"
              ? "bg-brand/15 text-brand"
              : "text-meet-muted hover:text-meet-text"
          }`}
        >
          Hint
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "answer"}
          onClick={() => setTab("answer")}
          className={`px-3 py-2 text-xs font-medium uppercase tracking-wide ${
            tab === "answer"
              ? "bg-brand/15 text-brand"
              : "text-meet-muted hover:text-meet-text"
          }`}
        >
          {isIntro ? "Your intro" : "Answer"}
        </button>
      </div>
      <div className="meet-scroll max-h-56 overflow-y-auto px-3 py-2">
        {tab === "hint" ? (
          <>
            {useStar && !isIntro ? (
              <p className="mb-2 text-brand">
                STAR: Situation → Task → Action → Result
              </p>
            ) : null}
            {checking ? (
              <p className="text-meet-muted">
                They&apos;re checking: {checking}
              </p>
            ) : isIntro ? (
              <p className="text-meet-muted">
                Speak the script under Your intro. Switch 30 sec / 1 min / 2 min
                to load that version — practice until it feels natural.
              </p>
            ) : (
              <p className="text-meet-muted">No hint for this question.</p>
            )}
            {fresherMistake ? (
              <p className="mt-2 text-amber-200/90">Avoid: {fresherMistake}</p>
            ) : null}
          </>
        ) : strongAnswer ? (
          <div className="space-y-2">
            {isIntro ? (
              <p className="text-xs uppercase tracking-wide text-brand">
                Your script — speak this aloud
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-meet-text">{strongAnswer}</p>
          </div>
        ) : (
          <p className="text-meet-muted">
            {isIntro
              ? "Intro scripts should be created during decode. Leave and Start again from the lobby (it will write them), or open Pack overview → Generate practice intros."
              : useStar
                ? "No sample yet — draft STAR out loud: Situation, Task, Action, Result."
                : "No sample answer for this question."}
          </p>
        )}
      </div>
    </div>
  );
}
