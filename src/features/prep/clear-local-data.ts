/** Keys that must survive "Clear all local data" (BYOK settings). */
function isProtectedKey(key: string) {
  return key.startsWith("mock-iv:byok:");
}

/** Wipe packs/sessions/reports — keeps API keys and provider choice. */
export function clearAllLocalPracticeData() {
  if (typeof window === "undefined" || !window.localStorage) return 0;

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("mock-iv:") && !isProtectedKey(key)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
  return keys.length;
}

export function clearActivePack() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mock-iv:active-pack");
}

export function setActivePackId(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id) {
    localStorage.removeItem("mock-iv:active-pack");
    return;
  }
  localStorage.setItem("mock-iv:active-pack", id);
}
