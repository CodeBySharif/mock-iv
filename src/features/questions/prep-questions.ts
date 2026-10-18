import type {
  InterviewerRole,
  QuestionSeed,
  SectionId,
  SessionDuration,
} from "@/types/interview";
import type { PredictedCategory, PredictedQuestion } from "@/types/prep";

/** How many predicted Qs (excluding intro) to keep for each plan length. */
export const PREP_DURATION_QUESTION_CAPS: Record<SessionDuration, number> = {
  15: 6,
  25: 10,
  45: 12,
};

const CATEGORY_META: Record<
  PredictedCategory,
  { section: SectionId; interviewerRole: InterviewerRole }
> = {
  behavioral: { section: "hr_qna", interviewerRole: "hr" },
  resume_project: { section: "project", interviewerRole: "technical" },
  technical: { section: "technical", interviewerRole: "technical" },
};

/** Stable interview order: HR/behavioral → resume/project → technical. */
const CATEGORY_ORDER: PredictedCategory[] = [
  "behavioral",
  "resume_project",
  "technical",
];

export function predictedToSeeds(
  questions: PredictedQuestion[],
  level: QuestionSeed["level"],
  duration?: SessionDuration,
): QuestionSeed[] {
  const selected = questions.filter((q) => q.selected);
  const ordered = CATEGORY_ORDER.flatMap((category) =>
    selected
      .filter((q) => q.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  const cap =
    duration != null ? PREP_DURATION_QUESTION_CAPS[duration] : ordered.length;
  // Keep category blocks contiguous (HR → project → technical) while balancing counts.
  const trimmed =
    ordered.length <= cap ? ordered : trimBalancedContiguous(ordered, cap);

  return trimmed.map((q) => {
    const meta = CATEGORY_META[q.category];
    return {
      id: q.id,
      level,
      section: meta.section,
      interviewerRole: meta.interviewerRole,
      prompt: q.prompt,
      tags: q.category === "behavioral" ? (["behavioral"] as const) : undefined,
    };
  });
}

function trimBalancedContiguous(ordered: PredictedQuestion[], cap: number) {
  const buckets = CATEGORY_ORDER.map((category) =>
    ordered.filter((q) => q.category === category),
  );
  const counts = buckets.map(() => 0);
  let remaining = cap;
  while (remaining > 0) {
    let progressed = false;
    for (let b = 0; b < buckets.length && remaining > 0; b += 1) {
      if (counts[b] < buckets[b].length) {
        counts[b] += 1;
        remaining -= 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  // Preserve CATEGORY_ORDER: all taken behavioral, then project, then technical.
  return buckets.flatMap((bucket, i) => bucket.slice(0, counts[i]));
}

export function coachFieldsForPredicted(q: PredictedQuestion) {
  return {
    checking: q.checking,
    fresherMistake: q.fresherMistake,
    strongAnswer: q.strongAnswer,
  };
}

export function countSelectedPredicted(questions: PredictedQuestion[] | undefined) {
  return questions?.filter((q) => q.selected).length ?? 0;
}
