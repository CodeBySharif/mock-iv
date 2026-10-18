import type { PrepPack } from "@/types/prep";

export type PrepStepId = "decode" | "predict" | "interview" | "cheatsheet";

export type PrepStepDef = {
  id: PrepStepId;
  number: number;
  title: string;
  short: string;
  href: string;
};

export const PREP_STEPS: PrepStepDef[] = [
  {
    id: "decode",
    number: 1,
    title: "Decode",
    short: "Role briefing",
    href: "/prep/decode",
  },
  {
    id: "predict",
    number: 2,
    title: "Predict",
    short: "Questions",
    href: "/prep/predict",
  },
  {
    id: "interview",
    number: 3,
    title: "Interview",
    short: "Practice",
    href: "/lobby",
  },
  {
    id: "cheatsheet",
    number: 4,
    title: "Cheat sheet",
    short: "Review",
    href: "/prep/cheat-sheet",
  },
];

export function packHasDecode(pack: PrepPack | null | undefined) {
  return !!pack?.decode;
}

export function packHasQuestions(pack: PrepPack | null | undefined) {
  return (pack?.questions?.length ?? 0) > 0;
}

export function packHasCheatSheet(pack: PrepPack | null | undefined) {
  return !!pack?.cheatSheet;
}

export function isStepReady(pack: PrepPack | null | undefined, step: PrepStepId) {
  if (!pack) return step === "decode";
  switch (step) {
    case "decode":
      return true;
    case "predict":
      return packHasDecode(pack);
    case "interview":
      return packHasQuestions(pack);
    case "cheatsheet":
      return (
        packHasQuestions(pack) ||
        pack.status === "interviewed" ||
        pack.status === "complete" ||
        packHasCheatSheet(pack)
      );
    default:
      return false;
  }
}

export function nextStepAfter(step: PrepStepId): PrepStepDef | null {
  const index = PREP_STEPS.findIndex((s) => s.id === step);
  return index >= 0 && index < PREP_STEPS.length - 1
    ? PREP_STEPS[index + 1]
    : null;
}

export function prevStepBefore(step: PrepStepId): PrepStepDef | null {
  const index = PREP_STEPS.findIndex((s) => s.id === step);
  return index > 0 ? PREP_STEPS[index - 1] : null;
}

export function packOverviewHref(packId: string) {
  return `/prep/pack/${packId}`;
}
