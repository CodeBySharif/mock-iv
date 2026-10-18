# Data Model

Prep packs persist in browser `localStorage` immediately; Postgres (Neon + Prisma) is the durable store when `DATABASE_URL` is set. See `prisma/schema.prisma` for `PracticeProfile`, `PrepPack`, `RoleDecode`, `PredictedQuestion`, interview messages, scorecards, and `CheatSheet`.

Classic Meet sessions below remain local-first during migration.

## Classic session (legacy localStorage)

Conceptual shapes:

## Session

```ts
type InterviewLevel = "junior" | "mid" | "senior";

type InterviewSession = {
  id: string;
  createdAt: string; // ISO
  endedAt?: string;
  level: InterviewLevel;
  tags: string[];
  status: "setup" | "active" | "completed" | "aborted";
  companyProfileId?: string; // placeholder profile for "why us"
  turnIds: string[];
};
```

## Turn (one question cycle)

```ts
type InterviewerRole = "hr" | "technical";

type SectionId =
  | "introduction"
  | "hr_qna"
  | "tech_stack"
  | "project"
  | "technical";

type DeliveryMetrics = {
  durationMs: number;
  wordCount: number;
  wordsPerMinute: number;
  fillerCount: number;
  fillerWords: string[];
  longPauseCount?: number;
  clarityProxyScore?: number; // 0–100 heuristic
};

type InterviewTurn = {
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
  status:
    | "pending"
    | "asking"
    | "thinking"
    | "recording"
    | "evaluating"
    | "done"
    | "skipped";
};
```

## Question seed (static content)

See [question-bank-overview](../04-questions/question-bank-overview.md). Stored as JSON under `src/` or `content/` when implementing.

## Report (derived view)

```ts
type SessionReport = {
  session: InterviewSession;
  turns: InterviewTurn[];
  summary: {
    turnsCompleted: number;
    avgWpm?: number;
    totalFillers?: number;
    sectionsCompleted: SectionId[];
  };
};
```

## Company profile (placeholder MVP)

```ts
type CompanyProfile = {
  id: string;
  name: string;
  blurb: string;
  products: string[];
  values: string[];
};
```

Used so “What do you know about us?” has something concrete without live research.

## Storage keys (suggested)

- `mock-iv:sessions` → Session[]  
- `mock-iv:turns:{sessionId}` → InterviewTurn[]  
- `mock-iv:active-session` → sessionId  

## Relationships

```text
Session 1──* Turn
Turn *──1 QuestionSeed (by questionId)
Session *──0..1 CompanyProfile
Report is Session + Turns + summary aggregates
```
