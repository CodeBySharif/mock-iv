export type PrepPackStatus =
  | "draft"
  | "decoded"
  | "predicted"
  | "interviewed"
  | "complete";

/** Experience band chosen at decode — drives think time & bank fallback. */
export type PrepExperienceLevel = "junior" | "mid" | "senior";

export type SkillToTest = {
  skill: string;
  rank: number;
  why: string;
};

export type RoleDecodePayload = {
  dayToDay: string;
  skillsToTest: SkillToTest[];
  matches: string[];
  gaps: string[];
  gapHandling: string[];
  company: {
    whatTheyDo: string;
    customers: string;
    recentMentions: string[];
    unknowns: string[];
  };
};

export type PredictedCategory = "resume_project" | "technical" | "behavioral";

export type PredictedQuestion = {
  id: string;
  category: PredictedCategory;
  prompt: string;
  checking: string;
  fresherMistake: string;
  strongAnswer: string;
  sortOrder: number;
  selected: boolean;
};

/** Practiced self-intros keyed by target length (seconds). */
export type IntroScripts = {
  30: string;
  60: string;
  120: string;
};

export type PrepPack = {
  id: string;
  practiceId: string;
  roleTitle: string;
  companyName: string;
  jdText: string;
  cvText: string;
  cvFileName?: string;
  experienceLevel?: PrepExperienceLevel;
  status: PrepPackStatus;
  createdAt: string;
  updatedAt: string;
  decode?: RoleDecodePayload;
  questions?: PredictedQuestion[];
  /** Past question prompts (current + prior sets) so regen avoids repeats. */
  questionHistory?: string[];
  /** Ready-to-speak intros for 30s / 1m / 2m practice. */
  introScripts?: IntroScripts;
  cheatSheet?: CheatSheetPayload;
};

export type CheatSheetPayload = {
  introScript: string;
  stories: { situation: string; action: string; result: string }[];
  struggledConcepts: { title: string; explanation: string }[];
  companyPoints: string[];
  smartQuestions: string[];
};
