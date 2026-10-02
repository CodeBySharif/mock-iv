import type { InterviewerRole } from "@/types/interview";

const HR_ACKS = [
  "That's a good answer.",
  "Got it, I appreciate the detail.",
  "Thank you for sharing that.",
  "Okay, that gives me a clear picture.",
];

const TECH_ACKS = [
  "That's a solid answer.",
  "Understood, thanks for walking through that.",
  "Okay, noted.",
  "Thanks, that is useful context.",
];

export function pickAcknowledgment(role: InterviewerRole, index: number) {
  const pool = role === "hr" ? HR_ACKS : TECH_ACKS;
  return pool[index % pool.length];
}
