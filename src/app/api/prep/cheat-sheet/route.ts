import { callLlmJson } from "@/lib/llm/call-json";
import { readProviderFromRequest } from "@/lib/llm/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  roleTitle: z.string().min(2),
  companyName: z.string().min(1),
  jdText: z.string().min(40),
  cvText: z.string().min(40),
  decode: z.unknown().optional(),
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        checking: z.string().optional(),
        strongAnswer: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .optional(),
  interviewNotes: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().optional(),
        score: z.number().optional(),
        tips: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  introSeconds: z.union([z.literal(30), z.literal(60), z.literal(120)]).optional(),
});

const responseSchema = z.object({
  introScript: z.string(),
  stories: z
    .array(
      z.object({
        situation: z.string(),
        action: z.string(),
        result: z.string(),
      }),
    )
    .min(2)
    .max(4),
  struggledConcepts: z
    .array(
      z.object({
        title: z.string(),
        explanation: z.string(),
      }),
    )
    .min(3)
    .max(6),
  companyPoints: z.array(z.string()).min(2).max(5),
  smartQuestions: z.array(z.string()).min(3).max(5),
});

export async function POST(request: Request) {
  const { provider, apiKey } = readProviderFromRequest(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add an API key in Settings for your selected provider." },
      { status: 401 },
    );
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    roleTitle,
    companyName,
    jdText,
    cvText,
    decode,
    questions,
    interviewNotes,
    introSeconds,
  } = parsed.data;

  const system = `You write a compact interview cheat sheet for a candidate.
Return JSON only:
{
  "introScript": string,
  "stories": [{"situation": string, "action": string, "result": string}],
  "struggledConcepts": [{"title": string, "explanation": string}],
  "companyPoints": string[],
  "smartQuestions": string[]
}
Rules:
- introScript: natural spoken "tell me about yourself" for about ${introSeconds ?? 60} seconds. First person.
- Exactly 3 stories, 3 lines each (situation / action / result). Use ONLY real CV experience. No invention.
- Exactly 5 struggledConcepts: things they should revise (from gaps, weak interview answers, or JD skills). 2 short lines each in explanation.
- Exactly 3 companyPoints they can bring up naturally.
- Exactly 4 smartQuestions to ask the interviewer at the end.
- Keep the whole sheet readable in ~10 minutes. Concise.`;

  const clip = (s: string, n: number) =>
    s.length <= n ? s : `${s.slice(0, n)}\n…[truncated]`;

  const user = JSON.stringify({
    roleTitle,
    companyName,
    jobDescription: clip(jdText, 5000),
    resume: clip(cvText, 7000),
    roleDecode: decode ?? null,
    predictedQuestions: (questions ?? []).slice(0, 12),
    interviewNotes: (interviewNotes ?? []).slice(0, 16),
  });

  try {
    const raw = await callLlmJson({ provider, apiKey, system, user });
    const validated = responseSchema.safeParse(raw);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Model returned unexpected shape",
          details: validated.error.flatten(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      cheatSheet: {
        introScript: validated.data.introScript,
        stories: validated.data.stories.slice(0, 3),
        struggledConcepts: validated.data.struggledConcepts.slice(0, 5),
        companyPoints: validated.data.companyPoints.slice(0, 3),
        smartQuestions: validated.data.smartQuestions.slice(0, 4),
      },
      provider,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cheat sheet failed" },
      { status: 502 },
    );
  }
}
