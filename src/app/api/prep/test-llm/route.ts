import { testLlmConnection } from "@/lib/llm/call-json";
import { readProviderFromRequest } from "@/lib/llm/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { provider, apiKey } = readProviderFromRequest(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Paste an API key for the selected provider first." },
      { status: 401 },
    );
  }

  try {
    const result = await testLlmConnection({ provider, apiKey });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 502 },
    );
  }
}
