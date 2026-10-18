import type {
  InterviewSession,
  InterviewTurn,
  SessionReport,
} from "@/types/interview";

const SESSIONS_KEY = "mock-iv:sessions";
const TURNS_KEY = (sessionId: string) => `mock-iv:turns:${sessionId}`;
const ACTIVE_KEY = "mock-iv:active-session";
const REPORT_SEQ_KEY = (dayKey: string) => `mock-iv:report-seq:${dayKey}`;

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function listSessions(): InterviewSession[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as InterviewSession[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: InterviewSession) {
  if (!canUseStorage()) return;
  const sessions = listSessions().filter((s) => s.id !== session.id);
  sessions.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 30)));
  localStorage.setItem(ACTIVE_KEY, session.id);
}

export function saveTurns(sessionId: string, turns: InterviewTurn[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(TURNS_KEY(sessionId), JSON.stringify(turns));
}

export function loadTurns(sessionId: string): InterviewTurn[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(TURNS_KEY(sessionId));
    return raw ? (JSON.parse(raw) as InterviewTurn[]) : [];
  } catch {
    return [];
  }
}

export function loadSession(sessionId: string) {
  return listSessions().find((s) => s.id === sessionId);
}

function hasAnswer(turn: InterviewTurn) {
  return Boolean(turn.transcriptFinal?.trim()) || Boolean(turn.metrics);
}

export function buildReport(
  session: InterviewSession,
  turns: InterviewTurn[],
): SessionReport {
  const answered = turns.filter(hasAnswer);
  const wpms = answered
    .map((t) => t.metrics?.wordsPerMinute)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const fillers = answered.map((t) => t.metrics?.fillerCount ?? 0);
  const scores = answered
    .map((t) => t.score)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const sectionsCompleted = [
    ...new Set(answered.map((t) => t.section)),
  ];

  return {
    session,
    turns,
    summary: {
      turnsCompleted: answered.length,
      avgWpm: wpms.length
        ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length)
        : undefined,
      totalFillers: fillers.reduce((a, b) => a + b, 0),
      avgScore: scores.length
        ? Math.round(
            (scores.reduce((a, b) => a + b, 0) / scores.length) * 10,
          ) / 10
        : undefined,
      sectionsCompleted,
    },
  };
}

export function clearAllSessionsAndReports() {
  if (!canUseStorage()) return;
  const sessions = listSessions();
  for (const session of sessions) {
    localStorage.removeItem(TURNS_KEY(session.id));
  }
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(ACTIVE_KEY);
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("mock-iv:report-seq:")) toRemove.push(key);
  }
  for (const key of toRemove) localStorage.removeItem(key);
}

export function formatReportDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { dd, mm, yyyy, slash: `${dd}/${mm}/${yyyy}`, dayKey: `${yyyy}-${mm}-${dd}` };
}

export function allocateReportSequence(dayKey: string) {
  if (!canUseStorage()) return 1;
  const raw = localStorage.getItem(REPORT_SEQ_KEY(dayKey));
  const current = raw ? Number.parseInt(raw, 10) : 0;
  const next = Number.isFinite(current) ? Math.min(current + 1, 100) : 1;
  localStorage.setItem(REPORT_SEQ_KEY(dayKey), String(next));
  return next;
}

export function buildReportFilename(createdAt: string, sequence: number) {
  const { dd, mm, yyyy } = formatReportDate(createdAt);
  const nnn = String(Math.min(Math.max(sequence, 1), 100)).padStart(3, "0");
  return `report_mock_interview_${dd}-${mm}-${yyyy}_${nnn}.pdf`;
}
