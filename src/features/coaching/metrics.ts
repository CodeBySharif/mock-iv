import type { DeliveryMetrics } from "@/types/interview";

const FILLERS = [
  "um",
  "uh",
  "erm",
  "like",
  "you know",
  "basically",
  "actually",
  "so yeah",
  "kind of",
  "sort of",
];

export function computeDeliveryMetrics(
  transcript: string,
  durationMs: number,
): DeliveryMetrics {
  const normalized = transcript.trim().toLowerCase();
  const words = normalized
    ? normalized.split(/\s+/).filter(Boolean)
    : [];
  const wordCount = words.length;
  const minutes = Math.max(durationMs / 60_000, 1 / 60);
  const wordsPerMinute = Math.round(wordCount / minutes);

  const fillerWords: string[] = [];
  for (const filler of FILLERS) {
    const pattern = new RegExp(`\\b${filler.replace(" ", "\\s+")}\\b`, "g");
    const matches = normalized.match(pattern);
    if (matches) {
      for (const match of matches) fillerWords.push(match);
    }
  }

  let clarityProxyScore = 70;
  if (wordCount < 12) clarityProxyScore -= 25;
  if (wordCount > 40) clarityProxyScore += 10;
  if (fillerWords.length >= 5) clarityProxyScore -= 15;
  if (fillerWords.length >= 10) clarityProxyScore -= 10;
  if (wordsPerMinute > 180) clarityProxyScore -= 10;
  if (wordsPerMinute > 0 && wordsPerMinute < 90) clarityProxyScore -= 5;
  clarityProxyScore = Math.max(0, Math.min(100, clarityProxyScore));

  return {
    durationMs,
    wordCount,
    wordsPerMinute,
    fillerCount: fillerWords.length,
    fillerWords,
    clarityProxyScore,
  };
}

export function buildHeuristicTips(
  transcript: string,
  metrics: DeliveryMetrics,
): string[] {
  const tips: string[] = [];

  if (metrics.wordCount < 12) {
    tips.push(
      "Your answer was very short. Aim for a clearer structure: context, what you did, and the result.",
    );
  }
  if (metrics.fillerCount >= 4) {
    tips.push(
      `You used filler words about ${metrics.fillerCount} times (${metrics.fillerWords.slice(0, 5).join(", ")}). Pause briefly instead of filling silence.`,
    );
  }
  if (metrics.wordsPerMinute > 170) {
    tips.push(
      `Pace was fast (~${metrics.wordsPerMinute} WPM). Slow down on key points so the interviewer can follow.`,
    );
  }
  if (metrics.wordsPerMinute > 0 && metrics.wordsPerMinute < 90 && metrics.wordCount >= 20) {
    tips.push(
      `Pace was slow (~${metrics.wordsPerMinute} WPM). Tighten the story and cut repeated phrases.`,
    );
  }
  if ((metrics.clarityProxyScore ?? 0) >= 75 && tips.length === 0) {
    tips.push(
      "Delivery sounded clear enough. Next, practice a stronger opening sentence for this question.",
    );
  }
  if (!transcript.trim()) {
    tips.push(
      "No speech was captured. Check the microphone and answer again when ready.",
    );
  }
  if (tips.length === 0) {
    tips.push(
      "Decent delivery baseline. Rehearse once more focusing on a crisp first 20 seconds.",
    );
  }

  return tips.slice(0, 3);
}
