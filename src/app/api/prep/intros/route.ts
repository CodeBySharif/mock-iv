import { generateIntroScripts } from "@/lib/prep/intro-scripts";
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

  try {
    const introScripts = await generateIntroScripts({
      provider,
      apiKey,
      ...parsed.data,
    });
    return NextResponse.json({ introScripts, provider });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Intro generation failed",
      },
      { status: 502 },
    );
  }
}
