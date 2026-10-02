"use client";

import { pickAcknowledgment } from "@/features/coaching/acknowledgments";
import {
  buildHeuristicTips,
  computeDeliveryMetrics,
} from "@/features/coaching/metrics";
import { selectQuestions } from "@/features/questions/select-questions";
import {
  buildReport,
  saveSession,
  saveTurns,
} from "@/features/report/storage";
import { DEFAULT_COMPANY } from "@/content/company";
import {
  SECTION_LABELS,
  THINK_SECONDS,
  type InterviewLevel,
  type InterviewSession,
  type InterviewTurn,
  type SectionId,
  type SessionDuration,
} from "@/types/interview";
import { create } from "zustand";

export type IntroBudget = 30 | 60 | 120;
export type SessionPhase = "greeting" | "questions";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildGreeting(level: InterviewLevel) {
  return `Hi, thanks for joining today. I'm Alex from People Ops at ${DEFAULT_COMPANY.name}, and with me is Sam from Engineering. We'll keep this conversational: a short self-intro, some background questions from me, then Sam will dig into your projects and technical experience. This is a ${level}-level practice interview. Whenever you're ready after I finish, we'll start with your introduction.`;
}

function buildIntroTurn(sessionId: string, budget: IntroBudget): InterviewTurn {
  return {
    id: uid("turn"),
    sessionId,
    index: 0,
    section: "introduction",
    interviewerRole: "hr",
    questionId: `intro-timed-${budget}`,
    questionText: `Please introduce yourself. Aim for about ${
      budget === 30 ? "30 seconds" : budget === 60 ? "1 minute" : "2 minutes"
    }. Cover who you are, what you work on, and the kinds of problems you enjoy solving.`,
    status: "asking",
  };
}

type SessionState = {
  session: InterviewSession | null;
  turns: InterviewTurn[];
  currentIndex: number;
  phase: SessionPhase;
  greetingText: string;
  thinkSecondsLeft: number;
  answerSecondsLeft: number | null;
  answerElapsedSeconds: number;
  introBudget: IntroBudget;
  sectionBanner: string | null;
  speechError: string | null;
  createSession: (level: InterviewLevel, duration: SessionDuration) => string;
  hydrateSession: (session: InterviewSession, turns: InterviewTurn[]) => void;
  getCurrentTurn: () => InterviewTurn | null;
  finishGreeting: () => void;
  setIntroBudget: (budget: IntroBudget) => void;
  setTurnStatus: (status: InterviewTurn["status"]) => void;
  setThinkSecondsLeft: (seconds: number) => void;
  setAnswerSecondsLeft: (seconds: number | null) => void;
  setAnswerElapsedSeconds: (seconds: number) => void;
  setTranscriptDraft: (text: string, appendFinal?: boolean) => void;
  beginAnswer: () => void;
  pauseAnswer: () => void;
  resumeAnswer: () => void;
  finishAnswer: (transcript: string) => Promise<void>;
  setAcknowledgmentPlaying: () => void;
  markFeedbackReady: () => void;
  goNext: (options?: {
    skipAsk?: boolean;
    browse?: boolean;
  }) => "next" | "complete";
  skipTurn: () => "next" | "complete";
  goPrevious: (options?: { browse?: boolean }) => void;
  abortSession: () => void;
  setSpeechError: (message: string | null) => void;
  clearBanner: () => void;
};

function resolveBrowseStatus(turn: InterviewTurn): InterviewTurn["status"] {
  if (
    turn.status === "done" ||
    turn.status === "skipped" ||
    turn.status === "feedback" ||
    turn.status === "evaluating" ||
    turn.status === "acknowledgment"
  ) {
    return "thinking";
  }
  if (turn.status === "recording" || turn.status === "paused") {
    return "thinking";
  }
  if (turn.status === "pending") return "asking";
  return turn.status;
}

function persist(session: InterviewSession, turns: InterviewTurn[]) {
  saveSession(session);
  saveTurns(session.id, turns);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  turns: [],
  currentIndex: 0,
  phase: "greeting",
  greetingText: "",
  thinkSecondsLeft: 0,
  answerSecondsLeft: null,
  answerElapsedSeconds: 0,
  introBudget: 60,
  sectionBanner: null,
  speechError: null,

  createSession: (level, duration) => {
    const sessionId = uid("sess");
    const qaQuestions = selectQuestions(level, duration).filter(
      (q) => q.section !== "introduction",
    );
    const introBudget: IntroBudget = 60;
    const intro = buildIntroTurn(sessionId, introBudget);

    const rest: InterviewTurn[] = qaQuestions.map((q, index) => ({
      id: uid("turn"),
      sessionId,
      index: index + 1,
      section: q.section,
      interviewerRole: q.interviewerRole,
      questionId: q.id,
      questionText:
        q.id.includes("hr-003") || q.prompt.toLowerCase().includes("know about us")
          ? `${q.prompt} (We are ${DEFAULT_COMPANY.name}. ${DEFAULT_COMPANY.blurb})`
          : q.prompt,
      status: "pending",
    }));

    const turns = [intro, ...rest].map((turn, index) => ({
      ...turn,
      index,
    }));

    const session: InterviewSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      level,
      durationMinutes: duration,
      tags: [],
      status: "active",
      companyProfileId: DEFAULT_COMPANY.id,
      turnIds: turns.map((t) => t.id),
    };

    persist(session, turns);
    set({
      session,
      turns,
      currentIndex: 0,
      phase: "greeting",
      greetingText: buildGreeting(level),
      thinkSecondsLeft: THINK_SECONDS[level],
      answerSecondsLeft: null,
      answerElapsedSeconds: 0,
      introBudget,
      sectionBanner: null,
      speechError: null,
    });
    return sessionId;
  },

  hydrateSession: (session, turns) => {
    const currentIndex = Math.max(
      0,
      turns.findIndex((t) => t.status !== "done" && t.status !== "skipped"),
    );
    const safeIndex = currentIndex === -1 ? Math.max(turns.length - 1, 0) : currentIndex;
    set({
      session,
      turns,
      currentIndex: safeIndex,
      phase: "questions",
      greetingText: buildGreeting(session.level),
      thinkSecondsLeft: THINK_SECONDS[session.level],
      answerSecondsLeft: null,
      answerElapsedSeconds: 0,
      introBudget: 60,
      sectionBanner: null,
      speechError: null,
    });
  },

  getCurrentTurn: () => {
    const { turns, currentIndex, phase } = get();
    if (phase !== "questions") return null;
    return turns[currentIndex] ?? null;
  },

  finishGreeting: () => {
    const { session, turns } = get();
    if (!session) return;
    const next = turns.map((turn, index) =>
      index === 0 ? { ...turn, status: "asking" as const } : turn,
    );
    persist(session, next);
    set({
      phase: "questions",
      turns: next,
      currentIndex: 0,
      thinkSecondsLeft: THINK_SECONDS[session.level],
      answerSecondsLeft: null,
      answerElapsedSeconds: 0,
    });
  },

  setIntroBudget: (budget) => {
    const { turns, currentIndex, session, phase } = get();
    if (!session || phase !== "questions") {
      set({ introBudget: budget });
      return;
    }
    const turn = turns[currentIndex];
    if (!turn?.questionId.startsWith("intro-timed")) {
      set({ introBudget: budget });
      return;
    }
    const updatedIntro = buildIntroTurn(session.id, budget);
    const next: InterviewTurn[] = turns.map((item, index) =>
      index === currentIndex
        ? {
            ...updatedIntro,
            id: item.id,
            index: item.index,
            status:
              item.status === "asking"
                ? ("asking" as const)
                : ("thinking" as const),
            transcriptDraft: item.transcriptDraft,
            transcriptFinal: item.transcriptFinal,
          }
        : item,
    );
    persist(session, next);
    set({ introBudget: budget, turns: next });
  },

  setTurnStatus: (status) => {
    const { turns, currentIndex, session } = get();
    if (!session) return;
    const next = turns.map((turn, index) =>
      index === currentIndex ? { ...turn, status } : turn,
    );
    persist(session, next);
    set({ turns: next });
  },

  setThinkSecondsLeft: (seconds) => set({ thinkSecondsLeft: seconds }),
  setAnswerSecondsLeft: (seconds) => set({ answerSecondsLeft: seconds }),
  setAnswerElapsedSeconds: (seconds) => set({ answerElapsedSeconds: seconds }),

  setTranscriptDraft: (text, appendFinal = false) => {
    const { turns, currentIndex, session } = get();
    if (!session) return;
    const next = turns.map((turn, index) => {
      if (index !== currentIndex) return turn;
      if (appendFinal) {
        const merged = [turn.transcriptFinal, text].filter(Boolean).join(" ");
        return {
          ...turn,
          transcriptFinal: merged.trim(),
          transcriptDraft: merged.trim(),
        };
      }
      return { ...turn, transcriptDraft: text.trim() };
    });
    set({ turns: next });
  },

  beginAnswer: () => {
    const { turns, currentIndex, session, introBudget } = get();
    if (!session) return;
    const turn = turns[currentIndex];
    const timed = turn?.questionId.startsWith("intro-timed");
    const next = turns.map((item, index) =>
      index === currentIndex
        ? {
            ...item,
            status: "recording" as const,
            answerStartedAt: item.answerStartedAt ?? new Date().toISOString(),
            transcriptDraft: item.transcriptFinal ?? item.transcriptDraft ?? "",
          }
        : item,
    );
    persist(session, next);
    set({
      turns: next,
      answerSecondsLeft: timed ? introBudget : null,
      answerElapsedSeconds: 0,
    });
  },

  pauseAnswer: () => {
    const { turns, currentIndex, session } = get();
    if (!session) return;
    const turn = turns[currentIndex];
    if (!turn || turn.status !== "recording") return;
    const committed =
      turn.transcriptDraft?.trim() || turn.transcriptFinal?.trim() || "";
    const next = turns.map((item, index) =>
      index === currentIndex
        ? {
            ...item,
            status: "paused" as const,
            transcriptFinal: committed,
            transcriptDraft: committed,
          }
        : item,
    );
    persist(session, next);
    set({ turns: next });
  },

  resumeAnswer: () => {
    const { turns, currentIndex, session } = get();
    if (!session) return;
    const turn = turns[currentIndex];
    if (!turn || turn.status !== "paused") return;
    const next = turns.map((item, index) =>
      index === currentIndex ? { ...item, status: "recording" as const } : item,
    );
    persist(session, next);
    set({ turns: next });
  },

  finishAnswer: async (transcript) => {
    const { turns, currentIndex, session, answerElapsedSeconds } = get();
    if (!session) return;
    const turn = turns[currentIndex];
    if (!turn) return;

    const durationMs = Math.max(
      1000,
      answerElapsedSeconds > 0
        ? answerElapsedSeconds * 1000
        : turn.answerStartedAt
          ? Date.now() - Date.parse(turn.answerStartedAt)
          : 1000,
    );
    const finalText = transcript.trim() || turn.transcriptDraft?.trim() || "";
    const metrics = computeDeliveryMetrics(finalText, durationMs);

    let tips = buildHeuristicTips(finalText, metrics);
    let acknowledgment = pickAcknowledgment(turn.interviewerRole, currentIndex);

    if (turn.questionId.startsWith("intro-timed")) {
      acknowledgment =
        "Thanks, that was a clear start. We'll keep going from here.";
    }

    try {
      const response = await fetch("/api/coaching/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: turn.questionText,
          transcript: finalText,
          metrics,
          level: session.level,
          section: turn.section,
          interviewerRole: turn.interviewerRole,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as {
          tips?: string[];
          acknowledgment?: string;
        };
        if (data.tips?.length) tips = data.tips;
        if (data.acknowledgment) acknowledgment = data.acknowledgment;
      }
    } catch {
      // heuristic fallback
    }

    const evaluating = turns.map((item, index) =>
      index === currentIndex
        ? {
            ...item,
            status: "evaluating" as const,
            answerEndedAt: new Date().toISOString(),
            transcriptFinal: finalText,
            transcriptDraft: finalText,
            metrics,
            tips,
            acknowledgmentText: acknowledgment,
          }
        : item,
    );
    persist(session, evaluating);
    set({ turns: evaluating, answerSecondsLeft: null });
  },

  setAcknowledgmentPlaying: () => {
    get().setTurnStatus("acknowledgment");
  },

  markFeedbackReady: () => {
    get().setTurnStatus("feedback");
  },

  goNext: (options) => {
    const { turns, currentIndex, session, phase } = get();
    if (!session || phase !== "questions") return "next";
    const skipAsk = options?.skipAsk === true;
    const browse = options?.browse === true;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= turns.length) {
      if (browse) return "next";
      const marked = turns.map((turn, index) =>
        index === currentIndex
          ? {
              ...turn,
              status:
                turn.status === "skipped" ? ("skipped" as const) : ("done" as const),
            }
          : turn,
      );
      const completed: InterviewSession = {
        ...session,
        status: "completed",
        endedAt: new Date().toISOString(),
      };
      persist(completed, marked);
      set({
        session: completed,
        turns: marked,
        answerSecondsLeft: null,
        answerElapsedSeconds: 0,
      });
      buildReport(completed, marked);
      return "complete";
    }

    if (browse) {
      const browsing = turns.map((turn, index) => {
        if (index === currentIndex) {
          if (turn.status === "recording" || turn.status === "paused") {
            return {
              ...turn,
              status: "thinking" as const,
              transcriptFinal:
                turn.transcriptDraft?.trim() || turn.transcriptFinal,
            };
          }
          return turn;
        }
        if (index === nextIndex) {
          return { ...turn, status: resolveBrowseStatus(turn) };
        }
        return turn;
      });
      persist(session, browsing);
      set({
        turns: browsing,
        currentIndex: nextIndex,
        thinkSecondsLeft: THINK_SECONDS[session.level],
        answerSecondsLeft: null,
        answerElapsedSeconds: 0,
        sectionBanner: null,
      });
      return "next";
    }

    const marked = turns.map((turn, index) =>
      index === currentIndex
        ? {
            ...turn,
            status:
              turn.status === "skipped" ? ("skipped" as const) : ("done" as const),
          }
        : turn,
    );

    const currentSection = marked[currentIndex]?.section;
    const nextSection = marked[nextIndex]?.section;
    let sectionBanner: string | null = null;
    if (currentSection && nextSection && currentSection !== nextSection) {
      if (currentSection === "hr_qna" && nextSection === "tech_stack") {
        sectionBanner =
          "Thanks from Alex. Sam from Engineering will continue with technical questions.";
      } else {
        sectionBanner = `${SECTION_LABELS[currentSection]} complete. Moving to ${SECTION_LABELS[nextSection]}.`;
      }
    }

    const advanced = marked.map((turn, index) =>
      index === nextIndex
        ? {
            ...turn,
            status: skipAsk ? ("thinking" as const) : ("asking" as const),
          }
        : turn,
    );
    persist(session, advanced);
    set({
      turns: advanced,
      currentIndex: nextIndex,
      thinkSecondsLeft: THINK_SECONDS[session.level],
      answerSecondsLeft: null,
      answerElapsedSeconds: 0,
      sectionBanner,
    });
    return "next";
  },

  skipTurn: () => {
    const { turns, currentIndex, session, phase } = get();
    if (!session || phase !== "questions") return "next";

    const marked = turns.map((turn, index) =>
      index === currentIndex
        ? {
            ...turn,
            status: "skipped" as const,
            answerEndedAt: new Date().toISOString(),
          }
        : turn,
    );
    persist(session, marked);
    set({ turns: marked, answerSecondsLeft: null, answerElapsedSeconds: 0 });
    return get().goNext();
  },

  goPrevious: (options) => {
    const { turns, currentIndex, session, phase } = get();
    if (!session || phase !== "questions" || currentIndex <= 0) return;
    const browse = options?.browse !== false;

    const prevIndex = currentIndex - 1;
    const next = turns.map((turn, index) => {
      if (index === currentIndex) {
        if (turn.status === "recording" || turn.status === "paused") {
          return {
            ...turn,
            status: "thinking" as const,
            transcriptFinal: turn.transcriptDraft?.trim() || turn.transcriptFinal,
          };
        }
        if (!browse && turn.status !== "done") {
          return { ...turn, status: "pending" as const };
        }
        return turn;
      }
      if (index === prevIndex) {
        return {
          ...turn,
          status: browse ? resolveBrowseStatus(turn) : ("thinking" as const),
        };
      }
      return turn;
    });
    persist(session, next);
    set({
      turns: next,
      currentIndex: prevIndex,
      thinkSecondsLeft: THINK_SECONDS[session.level],
      answerSecondsLeft: null,
      answerElapsedSeconds: 0,
      sectionBanner: null,
    });
  },

  abortSession: () => {
    const { session, turns } = get();
    if (!session) return;
    const aborted: InterviewSession = {
      ...session,
      status: "aborted",
      endedAt: new Date().toISOString(),
    };
    persist(aborted, turns);
    set({ session: aborted, answerSecondsLeft: null, answerElapsedSeconds: 0 });
  },

  setSpeechError: (message) => set({ speechError: message }),
  clearBanner: () => set({ sectionBanner: null }),
}));

export function isSectionHandoff(
  from: SectionId | undefined,
  to: SectionId | undefined,
) {
  return !!from && !!to && from !== to;
}
