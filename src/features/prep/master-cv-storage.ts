export type MasterCv = {
  text: string;
  fileName?: string;
  updatedAt: string;
};

export const MASTER_CV_KEY = "mock-iv:master-cv";
export const MASTER_CV_EVENT = "mock-iv:master-cv-changed";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function notifyMasterCvChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MASTER_CV_EVENT));
}

export function loadMasterCv(): MasterCv | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(MASTER_CV_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MasterCv;
    if (!parsed.text?.trim()) return null;
    return {
      text: parsed.text,
      fileName: parsed.fileName,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function hasMasterCv(): boolean {
  return Boolean(loadMasterCv()?.text?.trim());
}

export function saveMasterCv(input: {
  text: string;
  fileName?: string;
}): MasterCv {
  const next: MasterCv = {
    text: input.text.trim(),
    fileName: input.fileName,
    updatedAt: new Date().toISOString(),
  };
  if (canUseStorage()) {
    localStorage.setItem(MASTER_CV_KEY, JSON.stringify(next));
  }
  notifyMasterCvChanged();
  return next;
}

export function clearMasterCv() {
  if (!canUseStorage()) return;
  localStorage.removeItem(MASTER_CV_KEY);
  notifyMasterCvChanged();
}
