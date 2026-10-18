import { callLlmJson } from "@/lib/llm/call-json";
import { readProviderFromRequest } from "@/lib/llm/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  roleTitle: z.string().min(2),
  companyName: z.string().min(1),
  jdText: z.string().min(40),
  cvText: z.string().min(40),
  decode: z.unknown().optional(),
  messages: z.array(messageSchema).min(1).max(40),
  extraFacts: z.array(z.string().max(500)).max(40).optional(),
});

const responseSchema = z.object({
  reply: z.string().min(1),
  newFacts: z.array(z.string()).optional(),
  needsClarification: z.boolean().optional(),
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
    messages,
    extraFacts,
  } = parsed.data;

  const clip = (s: string, n: number) =>
    s.length <= n ? s : `${s.slice(0, n)}\n…[truncated]`;

  const system = `You are roleplaying as the interview candidate. Speak in first person ("I", "my").
You are applying for ${roleTitle} at ${companyName}.

Return JSON only:
{
  "reply": string,
  "newFacts": string[] (optional),
  "needsClarification": boolean (optional)
}

Rules:
- Answer as the candidate telling the real story of your work.
- Use ONLY facts from the resume, job description context, and extraFacts. Never invent employers, titles, tools, metrics, or outcomes.
- If the user's message supplies a concrete personal detail that is not already in the resume or extraFacts, put short factual notes into newFacts (e.g. "Led migration of X to Y in 2023").
- If you lack enough information to answer honestly, set needsClarification to true and ask ONE clear clarifying question in reply instead of guessing.
- Keep reply conversational and interview-ready (about 80–180 words when answering; shorter when clarifying).
- Do not break character or mention that you are an AI.`;

  const user = JSON.stringify({
    roleTitle,
    companyName,
    jobDescription: clip(jdText, 5000),
    resume: clip(cvText, 8000),
    roleDecode: decode ?? null,
    extraFacts: (extraFacts ?? []).slice(0, 40),
    conversation: messages.slice(-24).map((m) => ({
      role: m.role,
      content: clip(m.content, 2000),
    })),
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

    const newFacts = (validated.data.newFacts ?? [])
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 8);

    return NextResponse.json({
      reply: validated.data.reply.trim(),
      newFacts,
      needsClarification: Boolean(validated.data.needsClarification),
      provider,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Story room reply failed",
      },
      { status: 502 },
    );
  }
}
