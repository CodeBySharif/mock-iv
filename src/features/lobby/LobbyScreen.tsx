"use client";

import { DEFAULT_COMPANY } from "@/content/company";
import { ApplicantVideoTile } from "@/features/session/ApplicantVideoTile";
import { estimateSessionCopy } from "@/features/questions/select-questions";
import { listSessions } from "@/features/report/storage";
import { useMediaStore, type MediaMode } from "@/stores/media-store";
import { useSessionStore } from "@/stores/session-store";
import {
  SESSION_DURATIONS,
  type InterviewLevel,
  type SessionDuration,
} from "@/types/interview";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LEVELS: InterviewLevel[] = ["junior", "mid", "senior"];

const MEDIA_MODES: { id: MediaMode; label: string; hint: string }[] = [
  {
    id: "mic-only",
    label: "Mic only",
    hint: "No camera needed. Good for audio practice.",
  },
  {
    id: "camera-mic",
    label: "Cam + mic",
    hint: "Full Meet-style self view when a camera is available.",
  },
];

export function LobbyScreen() {
  const router = useRouter();
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [duration, setDuration] = useState<SessionDuration>(25);
  const [triedStart, setTriedStart] = useState(false);
  const [pastSessions, setPastSessions] = useState<
    ReturnType<typeof listSessions>
  >([]);

  const mode = useMediaStore((s) => s.mode);
  const stream = useMediaStore((s) => s.stream);
  const cameraOn = useMediaStore((s) => s.cameraOn);
  const setMode = useMediaStore((s) => s.setMode);
  const requestMedia = useMediaStore((s) => s.requestMedia);
  const requesting = useMediaStore((s) => s.requesting);
  const mediaError = useMediaStore((s) => s.error);
  const createSession = useSessionStore((s) => s.createSession);

  useEffect(() => {
    setPastSessions(listSessions().slice(0, 5));
  }, []);

  async function handleEnableDevices() {
    await requestMedia(mode);
  }

  async function handleModeChange(next: MediaMode) {
    if (next === mode) return;
    setMode(next);
  }

  async function handleStart() {
    setTriedStart(true);
    const ok = stream ? true : await requestMedia(mode);
    if (!ok) return;
    const sessionId = createSession(level, duration);
    router.push(`/session/${sessionId}`);
  }

  const previewReady =
    !!stream && (mode === "mic-only" || (mode === "camera-mic" && cameraOn));

  return (
    <div className="min-h-screen bg-meet-bg text-meet-text">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 md:px-8">
        <header className="mb-6 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Mock Interview
          </h1>
          <p className="mt-2 text-sm text-meet-muted md:text-base">
            Choose devices, level, and length, then join the practice call.
          </p>
        </header>

        <div className="grid items-stretch gap-4 md:grid-cols-2 md:gap-5">
          <div className="flex min-h-0 flex-col">
            {mode === "camera-mic" && stream && cameraOn ? (
              <ApplicantVideoTile stream={stream} cameraOn={cameraOn} fill />
            ) : stream && mode === "mic-only" ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 rounded-[12px] border border-meet-border bg-meet-surface px-6 text-center md:min-h-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-lg font-semibold text-brand-foreground">
                  You
                </div>
                <p className="text-sm font-medium text-meet-text">
                  Microphone ready
                </p>
                <p className="text-xs text-meet-muted">
                  Mic-only mode. Camera stays off for this session.
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 rounded-[12px] border border-meet-border bg-meet-surface px-6 text-center md:min-h-0">
                <p className="max-w-xs text-sm text-meet-muted">
                  {mode === "mic-only"
                    ? "Enable your microphone to practice without a camera."
                    : "Enable camera and microphone to preview how you will appear in the room."}
                </p>
                <button
                  type="button"
                  onClick={handleEnableDevices}
                  disabled={requesting}
                  className="rounded-[8px] bg-meet-border px-4 py-2.5 text-sm font-medium text-meet-text disabled:opacity-60"
                >
                  {requesting
                    ? "Waiting for browser…"
                    : mode === "mic-only"
                      ? "Enable microphone"
                      : "Enable camera and mic"}
                </button>
              </div>
            )}
          </div>

          <aside className="flex min-h-[280px] flex-col rounded-[12px] border border-meet-border bg-meet-surface p-5 md:min-h-0">
            <div className="flex flex-1 flex-col gap-5">
              <div>
                <p className="mb-2 text-sm font-medium">Devices</p>
                <div
                  role="group"
                  aria-label="Device mode"
                  className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-meet-border"
                >
                  {MEDIA_MODES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void handleModeChange(item.id)}
                      className={`px-3 py-2.5 text-sm ${
                        mode === item.id
                          ? "bg-brand text-brand-foreground"
                          : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-meet-muted">
                  {MEDIA_MODES.find((item) => item.id === mode)?.hint}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Level</p>
                <div
                  role="group"
                  aria-label="Interview level"
                  className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-meet-border"
                >
                  {LEVELS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLevel(item)}
                      className={`px-3 py-2.5 text-sm capitalize ${
                        level === item
                          ? "bg-brand text-brand-foreground"
                          : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Duration</p>
                <div
                  role="group"
                  aria-label="Session duration"
                  className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-meet-border"
                >
                  {SESSION_DURATIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDuration(item)}
                      className={`px-3 py-2.5 text-sm ${
                        duration === item
                          ? "bg-brand text-brand-foreground"
                          : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                      }`}
                    >
                      {item} min
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-meet-muted">
                  {estimateSessionCopy(duration)}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-meet-muted">
                Practice company for “why us”:{" "}
                <span className="text-meet-text">{DEFAULT_COMPANY.name}</span>.{" "}
                {DEFAULT_COMPANY.blurb}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleStart}
                disabled={requesting}
                className="w-full rounded-[8px] bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground disabled:opacity-60"
              >
                {requesting ? "Requesting access…" : "Start interview"}
              </button>

              {triedStart && mediaError ? (
                <p className="text-sm text-red-400" role="alert">
                  {mode === "mic-only"
                    ? "Allow microphone access in the browser, then try again."
                    : "Camera failed or was blocked. Switch to Mic only, or allow camera and mic, then try again."}
                </p>
              ) : null}

              {previewReady ? (
                <p className="text-xs text-meet-muted">Devices ready.</p>
              ) : null}
            </div>
          </aside>
        </div>

        {pastSessions.length > 0 ? (
          <div className="mt-8 border-t border-meet-border pt-5">
            <p className="mb-3 text-sm font-medium text-meet-text">Past reports</p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pastSessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/report/${session.id}`}
                    className="group flex items-center justify-between gap-3 rounded-[12px] border border-meet-border bg-meet-surface px-4 py-3 transition-colors hover:border-brand hover:bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium capitalize text-meet-text">
                        {session.level} interview
                        {session.durationMinutes
                          ? ` · ${session.durationMinutes} min`
                          : ""}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-meet-muted">
                        {new Date(session.createdAt).toLocaleString()} ·{" "}
                        {session.status}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-brand group-hover:underline">
                      Open
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
