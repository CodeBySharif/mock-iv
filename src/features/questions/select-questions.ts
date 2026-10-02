import { QUESTION_BANK } from "@/content/questions";
import {
  DURATION_COUNTS,
  SECTION_ORDER,
  countQuestionsForDuration,
  type InterviewLevel,
  type QuestionSeed,
  type SessionDuration,
} from "@/types/interview";

export function selectQuestions(
  level: InterviewLevel,
  duration: SessionDuration,
): QuestionSeed[] {
  const counts = DURATION_COUNTS[duration];
  const selected: QuestionSeed[] = [];

  for (const section of SECTION_ORDER) {
    const count = counts[section];
    const pool = QUESTION_BANK.filter(
      (q) => q.level === level && q.section === section,
    );
    selected.push(...pool.slice(0, count));
  }

  return selected;
}

export function estimateSessionCopy(duration: SessionDuration) {
  const questions = countQuestionsForDuration(duration);
  return `About ${questions} questions · ~${duration} minutes`;
}
