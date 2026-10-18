const KEY = "mock-iv:practice-id";

export function getOrCreatePracticeId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = `prac_${crypto.randomUUID()}`;
  localStorage.setItem(KEY, id);
  return id;
}
