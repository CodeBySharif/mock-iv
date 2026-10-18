import type { StoryRoomMessage } from "@/features/prep/story-room-storage";

export type InterrogationSession = {
  id: string;
  roleTitle: string;
  companyName: string;
  jdText: string;
  cvText: string;
  cvFileName?: string;
  createdAt: string;
  /** Display label e.g. role_company_datetime */
  label: string;
};

export type InterrogationThread = {
  sessionId: string;
  messages: StoryRoomMessage[];
  extraFacts: string[];
  updatedAt: string;
};

const SESSIONS_KEY = "mock-iv:interrogation-sessions";
const THREAD_KEY = (id: string) => `mock-iv:interrogation-thread:${id}`;
const ACTIVE_KEY = "mock-iv:interrogation-active";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function slugPart(s: string) {
  return s
    .trim()
    .replace(/[^\w\s.-]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40) || "session";
}

export function buildSessionLabel(
  roleTitle: string,
  companyName: string,
  createdAt: string,
) {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  return `${slugPart(roleTitle)}_${slugPart(companyName)}_${stamp}`;
}

export function listInterrogationSessions(): InterrogationSession[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const list = raw ? (JSON.parse(raw) as InterrogationSession[]) : [];
    return Array.isArray(list)
      ? list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

export function saveInterrogationSession(session: InterrogationSession) {
  if (!canUseStorage()) return;
  const rest = listInterrogationSessions().filter((s) => s.id !== session.id);
  localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify([session, ...rest].slice(0, 40)),
  );
  localStorage.setItem(ACTIVE_KEY, session.id);
}

export function loadInterrogationSession(id: string) {
  return listInterrogationSessions().find((s) => s.id === id) ?? null;
}

export function getActiveInterrogationSessionId() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveInterrogationSessionId(id: string | null) {
  if (!canUseStorage()) return;
  if (!id) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}

export function deleteInterrogationSession(id: string) {
  if (!canUseStorage()) return;
  const rest = listInterrogationSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(rest));
  localStorage.removeItem(THREAD_KEY(id));
  if (localStorage.getItem(ACTIVE_KEY) === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function loadInterrogationThread(
  sessionId: string,
): InterrogationThread | null {
  if (!canUseStorage() || !sessionId) return null;
  try {
    const raw = localStorage.getItem(THREAD_KEY(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InterrogationThread;
    return {
      sessionId,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      extraFacts: Array.isArray(parsed.extraFacts) ? parsed.extraFacts : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveInterrogationThread(thread: InterrogationThread) {
  if (!canUseStorage()) return;
  localStorage.setItem(
    THREAD_KEY(thread.sessionId),
    JSON.stringify({
      ...thread,
      messages: thread.messages.slice(-60),
      extraFacts: thread.extraFacts.slice(-40),
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearInterrogationThread(sessionId: string) {
  if (!canUseStorage() || !sessionId) return;
  localStorage.removeItem(THREAD_KEY(sessionId));
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
