import type { IntroScripts, PrepPack } from "@/types/prep";
import type { LlmProvider } from "@/lib/llm/types";
import { providerHeaders } from "@/lib/llm/headers";
import { savePrepPack } from "@/features/prep/storage";

export async function generateAndSaveIntroScripts(options: {
  pack: PrepPack;
  provider: LlmProvider;
  apiKey: string;
}): Promise<IntroScripts> {
  const res = await fetch("/api/prep/intros", {
    method: "POST",
    headers: providerHeaders(options.provider, options.apiKey),
    body: JSON.stringify({
      roleTitle: options.pack.roleTitle,
      companyName: options.pack.companyName,
      jdText: options.pack.jdText,
      cvText: options.pack.cvText,
      decode: options.pack.decode,
    }),
  });
  const data = (await res.json()) as {
    introScripts?: IntroScripts;
    error?: string;
  };
  if (!res.ok || !data.introScripts) {
    throw new Error(data.error || "Could not generate intro scripts");
  }

  const updated: PrepPack = {
    ...options.pack,
    introScripts: data.introScripts,
    updatedAt: new Date().toISOString(),
  };
  savePrepPack(updated);
  return data.introScripts;
}
