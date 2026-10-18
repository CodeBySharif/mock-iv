export type StoryRoomMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type StoryRoomThread = {
  packId: string;
  messages: StoryRoomMessage[];
  extraFacts: string[];
  updatedAt: string;
};

const KEY = (packId: string) => `mock-iv:story-room:${packId}`;

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadStoryRoom(packId: string): StoryRoomThread | null {
  if (!canUseStorage() || !packId) return null;
  try {
    const raw = localStorage.getItem(KEY(packId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoryRoomThread;
    if (parsed.packId !== packId) return null;
    return {
      packId,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      extraFacts: Array.isArray(parsed.extraFacts) ? parsed.extraFacts : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveStoryRoom(thread: StoryRoomThread) {
  if (!canUseStorage()) return;
  localStorage.setItem(
    KEY(thread.packId),
    JSON.stringify({
      ...thread,
      messages: thread.messages.slice(-60),
      extraFacts: thread.extraFacts.slice(-40),
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearStoryRoom(packId: string) {
  if (!canUseStorage() || !packId) return;
  localStorage.removeItem(KEY(packId));
}

export function mergeExtraFacts(
  existing: string[],
  incoming: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of [...existing, ...incoming]) {
    const t = f.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out.slice(-40);
}
