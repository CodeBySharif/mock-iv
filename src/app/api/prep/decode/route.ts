import { callLlmJson } from "@/lib/llm/call-json";
import { readProviderFromRequest } from "@/lib/llm/headers";
import { generateIntroScripts } from "@/lib/prep/intro-scripts";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  roleTitle: z.string().min(2),
  companyName: z.string().min(1),
  jdText: z.string().min(40),
  cvText: z.string().min(40),
});

const decodeSchema = z.object({
  dayToDay: z.string(),
  skillsToTest: z
    .array(
      z.object({
        skill: z.string(),
        rank: z.number(),
        why: z.string(),
      }),
    )
    .min(1)
    .max(5),
  matches: z.array(z.string()),
  gaps: z.array(z.string()).max(3),
  gapHandling: z.array(z.string()).max(3),
  company: z.object({
    whatTheyDo: z.string(),
    customers: z.string(),
    recentMentions: z.array(z.string()),
    unknowns: z.array(z.string()),
  }),
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

  const { roleTitle, companyName, jdText, cvText } = parsed.data;

  const system = `You are a senior recruiter who has hired for the role "${roleTitle}" for 10 years.
Decode this role for interview prep. Return ONLY valid JSON matching this shape:
{
  "dayToDay": string,
  "skillsToTest": [{"skill": string, "rank": number, "why": string}],
  "matches": string[],
  "gaps": string[exactly up to 3],
  "gapHandling": string[same length as gaps],
  "company": {
    "whatTheyDo": string,
    "customers": string,
    "recentMentions": string[],
    "unknowns": string[]
  }
}
Rules:
- skillsToTest: exactly 5, ranked 1-5 (1 = most likely tested).
- gaps: up to 3 gaps an interviewer will notice between resume and JD.
- gapHandling: one honest way to handle each gap if asked.
- If unsure about the company, put facts in unknowns and do NOT guess.
- Never invent experience that is not in the CV.`;

  const user = JSON.stringify({
    roleTitle,
    companyName,
    jobDescription: jdText,
    resume: cvText,
  });

  try {
    const raw = await callLlmJson({
      provider,
      apiKey,
      system,
      user,
    });
    const decoded = decodeSchema.safeParse(raw);
    if (!decoded.success) {
      return NextResponse.json(
        {
          error: "Model returned unexpected shape",
          details: decoded.error.flatten(),
        },
        { status: 502 },
      );
    }

    // Always build the three practice intros during decode so the interview has them.
    let introScripts = null;
    let introError: string | null = null;
    try {
      introScripts = await generateIntroScripts({
        provider,
        apiKey,
        roleTitle,
        companyName,
        jdText,
        cvText,
        decode: decoded.data,
      });
    } catch (e) {
      introError =
        e instanceof Error ? e.message : "Intro generation failed";
    }

    return NextResponse.json({
      decode: decoded.data,
      introScripts,
      introError,
      provider,
      source: provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decode failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
