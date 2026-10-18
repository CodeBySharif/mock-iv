export type LlmProvider = "gemini" | "openrouter" | "groq";

export const LLM_PROVIDERS: {
  id: LlmProvider;
  label: string;
  hint: string;
  keyPlaceholder: string;
  docsUrl: string;
}[] = [
  {
    id: "gemini",
    label: "Gemini",
    hint: "Google AI Studio key (AIza…)",
    keyPlaceholder: "AIza…",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    hint: "Uses free auto routing (openrouter/free) — may retry if empty",
    keyPlaceholder: "sk-or-…",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "groq",
    label: "Groq",
    hint: "GroqCloud API key",
    keyPlaceholder: "gsk_…",
    docsUrl: "https://console.groq.com/keys",
  },
];

/** Fixed models — no UI picker. */
export const AUTO_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.0-flash",
  openrouter: "openrouter/free",
  groq: "llama-3.3-70b-versatile",
};
