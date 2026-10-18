import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildHeuristicTips,
  computeDeliveryMetrics,
} from "@/features/coaching/metrics";
import { scoreAnswerHeuristic } from "@/features/coaching/score";
import { pickAcknowledgment } from "@/features/coaching/acknowledgments";

const bodySchema = z.object({
  questionText: z.string(),
  transcript: z.string(),
  metrics: z
    .object({
      durationMs: z.number(),
      wordCount: z.number(),
      wordsPerMinute: z.number(),
      fillerCount: z.number(),
      fillerWords: z.array(z.string()),
      clarityProxyScore: z.number().optional(),
    })
    .optional(),
  level: z.enum(["junior", "mid", "senior"]),
  section: z.string(),
  interviewerRole: z.enum(["hr", "technical"]),
  checking: z.string().optional(),
  strongAnswer: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    transcript,
    metrics,
    interviewerRole,
    questionText,
    level,
    checking,
    strongAnswer,
  } = parsed.data;
  const resolvedMetrics =
    metrics ??
    computeDeliveryMetrics(transcript, Math.max(transcript.length * 40, 1000));
  const fallbackTips = buildHeuristicTips(transcript, resolvedMetrics);
  const fallbackAck = pickAcknowledgment(interviewerRole, questionText.length);
  const heuristicScore = scoreAnswerHeuristic(transcript, resolvedMetrics);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      tips: fallbackTips,
      acknowledgment: fallbackAck,
      score: heuristicScore.score,
      scoreNote: heuristicScore.scoreNote,
      source: "heuristic",
    });
  }

  try {
    const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "mock-interview",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You coach interview answers. Prefer STAR (Situation, Task, Action, Result) when the question is behavioral/project. Score content + delivery 1-10 (strict but fair). Two vague sentences should score low. Return JSON: {"acknowledgment": string, "tips": string[1-3], "score": number, "scoreNote": string}.',
            },
            {
              role: "user",
              content: JSON.stringify({
                level,
                questionText,
                transcript,
                metrics: resolvedMetrics,
                interviewerRole,
                checking: checking ?? null,
                strongAnswerReference: strongAnswer ?? null,
              }),
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({
        tips: fallbackTips,
        acknowledgment: fallbackAck,
        score: heuristicScore.score,
        scoreNote: heuristicScore.scoreNote,
        source: "heuristic",
      });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsedContent = JSON.parse(content) as {
      tips?: string[];
      acknowledgment?: string;
      score?: number;
      scoreNote?: string;
    };

    const tips =
      Array.isArray(parsedContent.tips) && parsedContent.tips.length > 0
        ? parsedContent.tips.slice(0, 3)
        : fallbackTips;

    const scoreRaw = Number(parsedContent.score);
    const score = Number.isFinite(scoreRaw)
      ? Math.max(1, Math.min(10, Math.round(scoreRaw)))
      : heuristicScore.score;

    return NextResponse.json({
      tips,
      acknowledgment: parsedContent.acknowledgment || fallbackAck,
      score,
      scoreNote: parsedContent.scoreNote || heuristicScore.scoreNote,
      source: "openrouter",
    });
  } catch {
    return NextResponse.json({
      tips: fallbackTips,
      acknowledgment: fallbackAck,
      score: heuristicScore.score,
      scoreNote: heuristicScore.scoreNote,
      source: "heuristic",
    });
  }
}
