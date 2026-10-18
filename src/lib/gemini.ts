export function normalizeGeminiApiKey(raw: string) {
  let key = raw.trim().replace(/^["']|["']$/g, "");
  if (/^bearer\s+/i.test(key)) {
    key = key.replace(/^bearer\s+/i, "").trim();
  }
  return key;
}

export function assertGeminiApiKey(raw: string) {
  const key = normalizeGeminiApiKey(raw);
  if (!key) {
    throw new Error("Add a Gemini API key in Settings.");
  }
  // Google AI Studio keys look like AIza...
  // OAuth / access tokens trigger ACCESS_TOKEN_TYPE_UNSUPPORTED.
  if (key.startsWith("ya29.") || key.startsWith("eyJ")) {
    throw new Error(
      "That looks like an OAuth/access token, not a Gemini API key. Create an API key at https://aistudio.google.com/apikey (starts with AIza).",
    );
  }
  if (key.startsWith("sk-or-") || key.startsWith("sk-")) {
    throw new Error(
      "That looks like an OpenRouter/OpenAI key. Put your Gemini key (AIza…) in the Gemini field.",
    );
  }
  if (!key.startsWith("AIza")) {
    throw new Error(
      "Gemini API keys usually start with AIza. Get one from Google AI Studio: https://aistudio.google.com/apikey",
    );
  }
  return key;
}

export async function callGeminiJson(options: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}) {
  const apiKey = assertGeminiApiKey(options.apiKey);
  const model = options.model || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.system }] },
      contents: [{ role: "user", parts: [{ text: options.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Gemini rejected the API key (${response.status}). Use a Google AI Studio key from https://aistudio.google.com/apikey — not a Cloud OAuth token or OpenRouter key. Details: ${errText.slice(0, 180)}`,
      );
    }
    throw new Error(`Gemini error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";
  if (!text) throw new Error("Gemini returned empty content");
  return JSON.parse(text) as unknown;
}
