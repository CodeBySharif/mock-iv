export type InterviewLevel = "junior" | "mid" | "senior";

export type InterviewerRole = "hr" | "technical";

export type SectionId =
  | "introduction"
  | "hr_qna"
  | "tech_stack"
  | "project"
  | "technical";

export type TurnStatus =
  | "pending"
  | "asking"
  | "thinking"
  | "recording"
  | "paused"
  | "evaluating"
  | "acknowledgment"
  | "feedback"
  | "done"
  | "skipped";

export type SessionStatus = "setup" | "active" | "completed" | "aborted";

export type SessionDuration = 15 | 25 | 45;

export type QuestionTag =
  | "behavioral"
  | "javascript"
  | "csharp"
  | "oop"
  | "dotnet";

export type QuestionSeed = {
  id: string;
  level: InterviewLevel;
  section: SectionId;
  interviewerRole: InterviewerRole;
  prompt: string;
  tags?: QuestionTag[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
  estimatedAnswerSeconds?: number;
};

export type DeliveryMetrics = {
  durationMs: number;
  wordCount: number;
  wordsPerMinute: number;
  fillerCount: number;
  fillerWords: string[];
  longPauseCount?: number;
  clarityProxyScore?: number;
};

export type InterviewTurn = {
  id: string;
  sessionId: string;
  index: number;
  section: SectionId;
  interviewerRole: InterviewerRole;
  questionId: string;
  questionText: string;
  thinkStartedAt?: string;
  answerStartedAt?: string;
  answerEndedAt?: string;
  transcriptDraft?: string;
  transcriptFinal?: string;
  acknowledgmentText?: string;
  metrics?: DeliveryMetrics;
  tips?: string[];
  status: TurnStatus;
};

export type InterviewSession = {
  id: string;
  createdAt: string;
  endedAt?: string;
  level: InterviewLevel;
  durationMinutes?: SessionDuration;
  tags: QuestionTag[];
  status: SessionStatus;
  companyProfileId?: string;
  turnIds: string[];
};

export type SessionReport = {
  session: InterviewSession;
  turns: InterviewTurn[];
  summary: {
    turnsCompleted: number;
    avgWpm?: number;
    totalFillers?: number;
    sectionsCompleted: SectionId[];
  };
};

export const SECTION_LABELS: Record<SectionId, string> = {
  introduction: "Introduction",
  hr_qna: "HR Q&A",
  tech_stack: "Tech stack",
  project: "Project",
  technical: "Technical",
};

export const SECTION_ORDER: SectionId[] = [
  "introduction",
  "hr_qna",
  "tech_stack",
  "project",
  "technical",
];

export const SESSION_DURATIONS: SessionDuration[] = [15, 25, 45];

/** Question counts by planned duration (not by level). */
export const DURATION_COUNTS: Record<
  SessionDuration,
  Record<SectionId, number>
> = {
  15: {
    introduction: 1,
    hr_qna: 2,
    tech_stack: 1,
    project: 1,
    technical: 2,
  },
  25: {
    introduction: 1,
    hr_qna: 3,
    tech_stack: 2,
    project: 2,
    technical: 3,
  },
  45: {
    introduction: 1,
    hr_qna: 4,
    tech_stack: 3,
    project: 3,
    technical: 4,
  },
};

export function countQuestionsForDuration(duration: SessionDuration) {
  return Object.values(DURATION_COUNTS[duration]).reduce((a, b) => a + b, 0);
}

export const DEFAULT_COUNTS: Record<
  InterviewLevel,
  Record<SectionId, number>
> = {
  junior: DURATION_COUNTS[25],
  mid: DURATION_COUNTS[25],
  senior: DURATION_COUNTS[45],
};

export const THINK_SECONDS: Record<InterviewLevel, number> = {
  junior: 30,
  mid: 25,
  senior: 20,
};
