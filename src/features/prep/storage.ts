import type { PrepPack } from "@/types/prep";

const PACKS_KEY = "mock-iv:prep-packs";
const ACTIVE_PACK_KEY = "mock-iv:active-pack";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function listPrepPacks(): PrepPack[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(PACKS_KEY);
    return raw ? (JSON.parse(raw) as PrepPack[]) : [];
  } catch {
    return [];
  }
}

export function savePrepPack(pack: PrepPack) {
  if (!canUseStorage()) return;
  const packs = listPrepPacks().filter((p) => p.id !== pack.id);
  packs.unshift(pack);
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs.slice(0, 40)));
  localStorage.setItem(ACTIVE_PACK_KEY, pack.id);
}

export function loadPrepPack(id: string) {
  return listPrepPacks().find((p) => p.id === id) ?? null;
}

export function getActivePackId() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACTIVE_PACK_KEY);
}
