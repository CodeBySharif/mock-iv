import type { DeliveryMetrics } from "@/types/interview";

/** Heuristic 1–10 score when LLM scoring is unavailable. */
export function scoreAnswerHeuristic(
  transcript: string,
  metrics: DeliveryMetrics,
): { score: number; scoreNote: string } {
  const words = metrics.wordCount || transcript.trim().split(/\s+/).filter(Boolean).length;
  let score = 5;
  const notes: string[] = [];

  if (words < 12) {
    score -= 2;
    notes.push("very short");
  } else if (words < 25) {
    score -= 1;
    notes.push("could use more detail");
  } else if (words >= 40 && words <= 180) {
    score += 2;
    notes.push("good length");
  } else if (words > 220) {
    score -= 1;
    notes.push("a bit long");
  }

  if (metrics.fillerCount >= 8) {
    score -= 2;
    notes.push("many fillers");
  } else if (metrics.fillerCount >= 4) {
    score -= 1;
    notes.push("some fillers");
  } else if (words >= 20 && metrics.fillerCount <= 1) {
    score += 1;
    notes.push("clean delivery");
  }

  const wpm = metrics.wordsPerMinute;
  if (wpm > 0 && wpm < 90) {
    score -= 1;
    notes.push("slow pace");
  } else if (wpm > 175) {
    score -= 1;
    notes.push("rushed");
  } else if (wpm >= 110 && wpm <= 155) {
    score += 1;
  }

  const lower = transcript.toLowerCase();
  const hasSituation = /\b(when|at |during|project|team|company|role)\b/.test(
    lower,
  );
  const hasAction = /\b(i |we |my |built|implemented|fixed|led|designed)\b/.test(
    lower,
  );
  const hasResult =
    /\b(result|outcome|impact|improved|reduced|shipped|increased|saved|faster)\b/.test(
      lower,
    );
  if (hasSituation && hasAction && hasResult) {
    score += 2;
    notes.push("clear STAR shape");
  } else if (hasSituation && hasAction) {
    score += 1;
    notes.push("add a result");
  }

  score = Math.max(1, Math.min(10, Math.round(score)));
  return {
    score,
    scoreNote: notes.slice(0, 2).join("; ") || "Delivery-based estimate",
  };
}
