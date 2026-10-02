"use client";

import type { InterviewerRole } from "@/types/interview";

type ParticipantTileProps = {
  name: string;
  roleLabel: string;
  role: InterviewerRole | "applicant";
  speaking?: boolean;
  muted?: boolean;
  subtitle?: string;
  children?: React.ReactNode;
};

function MicMutedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 12.5A6 6 0 0 1 9.5 18" />
      <path d="M12 19v2" />
      <path d="M8 21h8" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function ParticipantTile({
  name,
  roleLabel,
  role,
  speaking = false,
  muted = false,
  subtitle,
  children,
}: ParticipantTileProps) {
  const initials = name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarColor =
    role === "hr"
      ? "bg-[#1e8e3e]"
      : role === "technical"
        ? "bg-[#1967d2]"
        : "bg-brand";

  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-hidden rounded-[12px] border bg-meet-surface ${
        speaking ? "speak-active border-brand" : "border-meet-border"
      }`}
    >
      {children ? (
        <div className="absolute inset-0">{children}</div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white sm:h-12 sm:w-12 ${avatarColor}`}
          >
            {initials || "?"}
          </div>
          <p className="text-[11px] text-meet-muted sm:text-xs">
            {speaking ? "Speaking" : subtitle || roleLabel}
          </p>
        </div>
      )}
      <span className="absolute bottom-1.5 left-1.5 z-10 max-w-[calc(100%-2.5rem)] truncate rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-meet-text sm:bottom-2 sm:left-2 sm:text-xs">
        {name}
        <span className="text-meet-muted"> · {roleLabel}</span>
      </span>
      {muted ? (
        <span
          className="absolute bottom-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-record text-white sm:bottom-2 sm:right-2"
          title="Muted"
          aria-label="Muted"
        >
          <MicMutedIcon />
        </span>
      ) : null}
      {speaking ? (
        <span className="absolute right-1.5 top-1.5 z-10 rounded bg-brand px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-brand-foreground sm:right-2 sm:top-2 sm:text-[10px]">
          Live
        </span>
      ) : null}
    </div>
  );
}
