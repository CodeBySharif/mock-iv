import type { SectionId } from "@/types/interview";

export type IntroLength = 30 | 60 | 120;

export function introTargetCopy(budget: IntroLength) {
  if (budget === 30) {
    return {
      label: "30 sec",
      guidance:
        "Aim ~40–70 words. Who you are → 1 recent focus → what you want next. Skip deep STAR.",
      skeleton:
        "I'm [name/role]. Lately I've been [1 project or stack]. I'm excited about [this role] because [1 reason].",
    };
  }
  if (budget === 60) {
    return {
      label: "1 min",
      guidance:
        "Aim ~90–140 words. Brief background → one concrete highlight → why this company/role.",
      skeleton:
        "I'm [role] with [background]. One project I'm proud of: [what / your part / result]. I'm interested in [company] because [fit].",
    };
  }
  return {
    label: "2 min",
    guidance:
      "Aim ~180–260 words. Path → 2 highlights (light STAR) → strengths → why this role.",
    skeleton:
      "I started [path]. Then [project 1: situation → what I did → result]. Also [project 2 briefly]. I work best [strength]. That's why [this role] fits.",
  };
}

export function answerLengthGuidance(section: SectionId, isIntro: boolean) {
  if (isIntro) return null;
  if (section === "hr_qna" || section === "project") {
    return {
      useStar: true,
      line: "Use STAR when you can: Situation → Task → Action → Result. Aim ~60–90 sec (about 120–180 words). Two short sentences is usually too thin.",
    };
  }
  if (section === "technical" || section === "tech_stack") {
    return {
      useStar: false,
      line: "Explain clearly: what it is → how you'd use it here → one real example. Aim ~45–75 sec. Two sentences can work only if both are concrete.",
    };
  }
  return {
    useStar: true,
    line: "Prefer a short STAR story over 2–3 vague sentences. Aim ~60–90 sec.",
  };
}
