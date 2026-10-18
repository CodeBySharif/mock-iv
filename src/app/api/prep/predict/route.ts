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
  /** Prior prompts the model must not reuse or paraphrase. */
  avoidPrompts: z.array(z.string()).max(40).optional(),
});

const questionSchema = z.object({
  category: z.enum(["resume_project", "technical", "behavioral"]),
  prompt: z.string(),
  checking: z.string(),
  fresherMistake: z.string(),
  strongAnswer: z.string(),
  sortOrder: z.number().optional(),
});

const responseSchema = z.object({
  questions: z.array(questionSchema).min(8).max(16),
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

  const { roleTitle, companyName, jdText, cvText, decode, avoidPrompts } =
    parsed.data;

  const avoidList = (avoidPrompts ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 40);

  const system = `You prepare interview candidates using ONLY their real resume and the job description.
Return JSON only:
{
  "questions": [
    {
      "category": "resume_project" | "technical" | "behavioral",
      "prompt": string,
      "checking": string,
      "fresherMistake": string,
      "strongAnswer": string,
      "sortOrder": number
    }
  ]
}
Rules:
- Exactly 12 questions: 4 resume_project, 4 technical, 4 behavioral.
- strongAnswer must use only experience present in the CV. For behavioral, use STAR (Situation, Task, Action, Result) in natural prose.
- Do NOT invent projects, titles, tools, or results not in the CV.
- If the CV lacks detail, write a strongAnswer that honestly frames limited experience without fabricating.
- If avoidPrompts is provided, invent a FRESH set: do not reuse, copy, or lightly paraphrase any avoided prompt. Cover different angles, projects, skills, or behaviors.`;

  // Cap payload size — free OpenRouter models often return empty on huge prompts.
  const clip = (s: string, n: number) =>
    s.length <= n ? s : `${s.slice(0, n)}\n…[truncated]`;

  const user = JSON.stringify({
    roleTitle,
    companyName,
    jobDescription: clip(jdText, 6000),
    resume: clip(cvText, 8000),
    roleDecode: decode ?? null,
    avoidPrompts: avoidList.length ? avoidList : undefined,
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

    const byCategory = {
      resume_project: validated.data.questions.filter(
        (q) => q.category === "resume_project",
      ),
      technical: validated.data.questions.filter((q) => q.category === "technical"),
      behavioral: validated.data.questions.filter(
        (q) => q.category === "behavioral",
      ),
    };

    const picked = [
      ...byCategory.resume_project.slice(0, 4),
      ...byCategory.technical.slice(0, 4),
      ...byCategory.behavioral.slice(0, 4),
    ];

    if (picked.length < 12) {
      return NextResponse.json(
        {
          error:
            "Model did not return enough questions in each category (need 4 resume/project, 4 technical, 4 behavioral). Try again.",
        },
        { status: 502 },
      );
    }

    const questions = picked.map((q, index) => ({
      ...q,
      sortOrder: index + 1,
    }));

    return NextResponse.json({ questions, provider, source: provider });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Predict failed" },
      { status: 502 },
    );
  }
}
