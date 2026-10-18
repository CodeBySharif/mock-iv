import { callLlmJson } from "@/lib/llm/call-json";
import type { LlmProvider } from "@/lib/llm/types";
import type { IntroScripts } from "@/types/prep";
import { z } from "zod";

const responseSchema = z.object({
  candidateName: z.string().min(1).optional(),
  intro30: z.string().min(20),
  intro60: z.string().min(40),
  intro120: z.string().min(80),
});

/** Best-effort name from top of a CV (first non-empty line that looks like a name). */
export function extractNameFromCv(cvText: string): string | null {
  const lines = cvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    if (line.length < 3 || line.length > 60) continue;
    if (/@|http|www\.|linkedin|github|tel:|phone|email|curriculum|resume|cv\b/i.test(line)) {
      continue;
    }
    if (/\d{3,}/.test(line)) continue;
    // Prefer 2–4 capitalized words
    const words = line.replace(/[,|•·].*$/, "").trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-z'’-]+$/.test(w))) {
      return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    }
  }
  return null;
}

function sanitizeIntro(text: string, name: string | null) {
  let out = text.trim();
  // Replace common placeholder patterns with the real name.
  if (name) {
    out = out
      .replace(/\[(?:full )?name\]/gi, name)
      .replace(/\[(?:your )?name\]/gi, name)
      .replace(/\b(?:your name|candidate name)\b/gi, name);
    // If it doesn't open with a greeting using the name, prepend a natural start.
    const nameFirst = name.split(/\s+/)[0] ?? name;
    if (!new RegExp(nameFirst, "i").test(out.slice(0, 80))) {
      out = `Hi, I'm ${name}. ${out.replace(/^(hi[,!]?\s*|hello[,!]?\s*|hey[,!]?\s*)+/i, "")}`;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

export async function generateIntroScripts(options: {
  provider: LlmProvider;
  apiKey: string;
  roleTitle: string;
  companyName: string;
  jdText: string;
  cvText: string;
  decode?: unknown;
}): Promise<IntroScripts> {
  const guessedName = extractNameFromCv(options.cvText);

  const system = `You write practiced spoken self-introductions for interviews.
Return JSON only:
{
  "candidateName": string,
  "intro30": string,
  "intro60": string,
  "intro120": string
}
Rules:
- candidateName: the person's real full name from the resume header (not "Candidate").
- Each intro MUST start by saying their real name, e.g. "Hi, I'm ${guessedName || "Alex Tan"}."
- First person, natural spoken English. Ready to read aloud — not bullets, not placeholders like [name] or [role].
- Use ONLY facts from the resume. Do NOT invent employers, titles, tools, or metrics.
- Tailor lightly to the role "${options.roleTitle}" at "${options.companyName}".
- intro30: ~45–70 words (~30 seconds).
- intro60: ~90–140 words (~1 minute).
- intro120: ~180–260 words (~2 minutes).
- No markdown, no stage directions.`;

  const clip = (s: string, n: number) =>
    s.length <= n ? s : `${s.slice(0, n)}\n…[truncated]`;

  const raw = await callLlmJson({
    provider: options.provider,
    apiKey: options.apiKey,
    system,
    user: JSON.stringify({
      guessedNameFromCvHeader: guessedName,
      roleTitle: options.roleTitle,
      companyName: options.companyName,
      jobDescription: clip(options.jdText, 4000),
      resume: clip(options.cvText, 7000),
      roleDecode: options.decode ?? null,
    }),
  });

  const validated = responseSchema.safeParse(raw);
  if (!validated.success) {
    throw new Error("Model returned unexpected intro shape");
  }

  const name =
    validated.data.candidateName?.trim() || guessedName || null;

  return {
    30: sanitizeIntro(validated.data.intro30, name),
    60: sanitizeIntro(validated.data.intro60, name),
    120: sanitizeIntro(validated.data.intro120, name),
  };
}
