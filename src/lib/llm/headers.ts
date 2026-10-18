import type { LlmProvider } from "@/lib/llm/types";

function cleanKey(raw: string) {
  let key = raw.trim().replace(/^["']|["']$/g, "");
  if (/^bearer\s+/i.test(key)) key = key.replace(/^bearer\s+/i, "").trim();
  return key;
}

export function providerHeaders(provider: LlmProvider, apiKey: string) {
  return {
    "Content-Type": "application/json",
    "X-LLM-Provider": provider,
    "X-LLM-Key": cleanKey(apiKey),
  };
}

export function readProviderFromRequest(request: Request): {
  provider: LlmProvider;
  apiKey: string;
} {
  const providerRaw = (request.headers.get("x-llm-provider") || "gemini").toLowerCase();
  const provider = (
    ["gemini", "openrouter", "groq"].includes(providerRaw)
      ? providerRaw
      : "gemini"
  ) as LlmProvider;
  const apiKey =
    request.headers.get("x-llm-key") ||
    request.headers.get("x-gemini-key") ||
    request.headers.get("x-openrouter-key") ||
    "";
  return { provider, apiKey: cleanKey(apiKey) };
}
