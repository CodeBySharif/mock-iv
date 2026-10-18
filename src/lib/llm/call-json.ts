import { assertGeminiApiKey, callGeminiJson } from "@/lib/gemini";
import { AUTO_MODELS, type LlmProvider } from "@/lib/llm/types";

function cleanKey(raw: string) {
  let key = raw.trim().replace(/^["']|["']$/g, "");
  if (/^bearer\s+/i.test(key)) key = key.replace(/^bearer\s+/i, "").trim();
  return key;
}

export { providerHeaders, readProviderFromRequest } from "@/lib/llm/headers";

type ChatChoice = {
  finish_reason?: string | null;
  native_finish_reason?: string | null;
  message?: {
    content?: string | Array<{ type?: string; text?: string }> | null;
    reasoning?: string | null;
  } | null;
  error?: { message?: string } | null;
};

type ChatCompletion = {
  id?: string;
  model?: string;
  error?: { message?: string; code?: string | number } | null;
  choices?: ChatChoice[];
};

function extractContent(choice: ChatChoice | undefined): string {
  const message = choice?.message;
  if (!message) return "";
  const content = message.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("")
      .trim();
  }
  // Some free models put usable text only in reasoning and leave content null.
  if (typeof message.reasoning === "string" && message.reasoning.trim()) {
    return message.reasoning.trim();
  }
  return "";
}

function parseJsonLoose(text: string): unknown {
  let candidate = text.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) candidate = fence[1].trim();

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as unknown;
    }
    throw new Error("Model reply was not valid JSON");
  }
}

async function openRouterOnce(options: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  useJsonObject: boolean;
  maxTokens: number;
}): Promise<{ text: string; data: ChatCompletion }> {
  const body: Record<string, unknown> = {
    model: options.model,
    max_tokens: options.maxTokens,
    temperature: 0.4,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
  };
  if (options.useJsonObject) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "mock-interview",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText.slice(0, 280)}`);
  }

  const data = (await response.json()) as ChatCompletion;
  if (data.error?.message) {
    throw new Error(`OpenRouter: ${data.error.message}`);
  }

  const choice = data.choices?.[0];
  if (choice?.error?.message) {
    throw new Error(`OpenRouter: ${choice.error.message}`);
  }

  return { text: extractContent(choice), data };
}

async function callOpenRouterJson(options: {
  apiKey: string;
  system: string;
  user: string;
}) {
  const model =
    process.env.OPENROUTER_MODEL?.trim() || AUTO_MODELS.openrouter;
  const maxTokens = 8192;

  // Free router often returns null content; retry with/without json_object.
  const attempts: Array<{ useJsonObject: boolean; label: string }> = [
    { useJsonObject: true, label: "json_object" },
    { useJsonObject: false, label: "plain" },
    { useJsonObject: false, label: "plain-retry" },
  ];

  let lastDetail = "";

  for (const attempt of attempts) {
    const { text, data } = await openRouterOnce({
      apiKey: options.apiKey,
      model,
      system: options.system,
      user: options.user,
      useJsonObject: attempt.useJsonObject,
      maxTokens,
    });

    if (text) {
      try {
        return parseJsonLoose(text);
      } catch (e) {
        lastDetail =
          e instanceof Error
            ? e.message
            : "Could not parse model JSON";
        continue;
      }
    }

    const choice = data.choices?.[0];
    lastDetail = [
      `model=${data.model ?? model}`,
      `finish=${choice?.finish_reason ?? choice?.native_finish_reason ?? "unknown"}`,
      `mode=${attempt.label}`,
    ].join(" ");
  }

  throw new Error(
    `OpenRouter returned empty content (${lastDetail}). Free models are flaky — try again, switch provider in Settings, or set OPENROUTER_MODEL to a specific free model.`,
  );
}

async function callGroqJson(options: {
  apiKey: string;
  system: string;
  user: string;
}) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AUTO_MODELS.groq,
      max_tokens: 8192,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq error ${response.status}: ${errText.slice(0, 280)}`);
  }

  const data = (await response.json()) as ChatCompletion;
  const text = extractContent(data.choices?.[0]);
  if (!text) throw new Error("Groq returned empty content");
  return parseJsonLoose(text);
}

export async function callLlmJson(options: {
  provider: LlmProvider;
  apiKey: string;
  system: string;
  user: string;
}) {
  const apiKey = cleanKey(options.apiKey);
  if (!apiKey) throw new Error("API key is missing. Add it in Settings.");

  if (options.provider === "gemini") {
    return callGeminiJson({
      apiKey: assertGeminiApiKey(apiKey),
      model: AUTO_MODELS.gemini,
      system: options.system,
      user: options.user,
    });
  }
  if (options.provider === "openrouter") {
    return callOpenRouterJson({
      apiKey,
      system: options.system,
      user: options.user,
    });
  }
  return callGroqJson({
    apiKey,
    system: options.system,
    user: options.user,
  });
}

export async function testLlmConnection(options: {
  provider: LlmProvider;
  apiKey: string;
}) {
  const result = await callLlmJson({
    provider: options.provider,
    apiKey: options.apiKey,
    system: 'Reply with JSON only: {"ok":true,"provider":"<name>"}',
    user: `Confirm connectivity for provider ${options.provider}.`,
  });
  return {
    ok: true as const,
    provider: options.provider,
    model: AUTO_MODELS[options.provider],
    sample: result,
  };
}
