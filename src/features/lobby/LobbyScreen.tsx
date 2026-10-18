"use client";

import { DEFAULT_COMPANY } from "@/content/company";
import { countSelectedPredicted } from "@/features/questions/prep-questions";
import { estimateSessionCopy } from "@/features/questions/select-questions";
import { generateAndSaveIntroScripts } from "@/features/prep/generate-intros";
import { packOverviewHref } from "@/features/prep/prep-steps";
import {
  getActivePackId,
  loadPrepPack,
} from "@/features/prep/storage";
import { listSessions } from "@/features/report/storage";
import { ApplicantVideoTile } from "@/features/session/ApplicantVideoTile";
import { useMediaStore, type MediaMode } from "@/stores/media-store";
import { useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  SESSION_DURATIONS,
  type InterviewLevel,
  type QuestionSource,
  type SessionDuration,
} from "@/types/interview";
import type { PrepPack } from "@/types/prep";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function hasAllIntros(pack: PrepPack | null | undefined) {
  return Boolean(
    pack?.introScripts?.[30] &&
      pack?.introScripts?.[60] &&
      pack?.introScripts?.[120],
  );
}

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
  const [duration, setDuration] = useState<SessionDuration>(25);
  const [triedStart, setTriedStart] = useState(false);
  const [pack, setPack] = useState<PrepPack | null>(null);
  const [questionSource, setQuestionSource] =
    useState<QuestionSource>("classic");
  const [recordSession, setRecordSession] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
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
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);

  const selectedCount = useMemo(
    () => countSelectedPredicted(pack?.questions),
    [pack],
  );
  const hasPrepQuestions = selectedCount > 0;
  const level: InterviewLevel = pack?.experienceLevel ?? "mid";

  useEffect(() => {
    hydrateSettings();
    setPastSessions(listSessions().slice(0, 8));
    const id = getActivePackId();
    const loaded = id ? loadPrepPack(id) : null;
    setPack(loaded);
    if (countSelectedPredicted(loaded?.questions) > 0) {
      setQuestionSource("prep");
    } else {
      setQuestionSource("classic");
    }
  }, [hydrateSettings]);

  async function handleEnableDevices() {
    await requestMedia(mode);
  }

  async function handleModeChange(next: MediaMode) {
    if (next === mode) return;
    setMode(next);
  }

  async function handleStart() {
    setTriedStart(true);
    setStartError(null);
    const ok = stream ? true : await requestMedia(mode);
    if (!ok) return;
    const source =
      questionSource === "prep" && hasPrepQuestions ? "prep" : "classic";

    // Prep interviews must have real named intros before the room starts.
    if (source === "prep") {
      let current = pack ?? (getActivePackId() ? loadPrepPack(getActivePackId()!) : null);
      if (current && !hasAllIntros(current)) {
        const key = activeKey();
        if (!key) {
          setStartError(
            "Add an API key in Settings so we can write your 30s / 1m / 2m intros.",
          );
          return;
        }
        setStarting(true);
        try {
          const introScripts = await generateAndSaveIntroScripts({
            pack: current,
            provider,
            apiKey: key,
          });
          current = { ...current, introScripts };
          setPack(current);
        } catch (e) {
          setStartError(
            e instanceof Error
              ? e.message
              : "Could not generate intros. Open pack overview and regenerate.",
          );
          setStarting(false);
          return;
        }
        setStarting(false);
      }
    }

    const sessionId = createSession({
      level,
      duration,
      questionSource: source,
      recordSession,
    });
    router.push(`/session/${sessionId}`);
  }

  const previewReady =
    !!stream && (mode === "mic-only" || (mode === "camera-mic" && cameraOn));

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-meet-bg text-meet-text">
      <header className="z-40 shrink-0 border-b border-meet-border bg-meet-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Link
                href="/"
                className="font-medium text-meet-text hover:underline"
              >
                Home
              </Link>
              <span className="text-meet-muted" aria-hidden>
                /
              </span>
            <Link
              href="/prep"
              className="text-meet-muted hover:text-meet-text hover:underline"
            >
              Prep hub
            </Link>
              {pack ? (
                <>
                  <span className="text-meet-muted" aria-hidden>
                    /
                  </span>
                  <Link
                    href={packOverviewHref(pack.id)}
                    className="truncate text-meet-muted hover:text-meet-text hover:underline"
                  >
                    {pack.roleTitle}
                  </Link>
                </>
              ) : null}
            </div>
            <h1 className="mt-1 truncate font-display text-lg font-semibold sm:text-xl">
              Interview lobby
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {pack ? (
              <>
                <Link
                  href={packOverviewHref(pack.id)}
                  className="rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm font-medium hover:border-brand"
                >
                  Pack
                </Link>
                <Link
                  href="/prep/predict"
                  className="rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm font-medium hover:border-brand"
                >
                  Predict
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="meet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-8">
          <p className="mb-6 max-w-2xl text-sm text-meet-muted md:text-base">
            Set length, enable devices, then start. Use Home or Pack overview to
            jump between steps.
          </p>

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
                <p className="mb-2 text-sm font-medium">Question set</p>
                <div
                  role="group"
                  aria-label="Question source"
                  className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-meet-border"
                >
                  <button
                    type="button"
                    disabled={!hasPrepQuestions}
                    onClick={() => setQuestionSource("prep")}
                    className={`px-3 py-2.5 text-sm disabled:opacity-40 ${
                      questionSource === "prep"
                        ? "bg-brand text-brand-foreground"
                        : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                    }`}
                  >
                    Prep pack
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionSource("classic")}
                    className={`px-3 py-2.5 text-sm ${
                      questionSource === "classic"
                        ? "bg-brand text-brand-foreground"
                        : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                    }`}
                  >
                    Classic bank
                  </button>
                </div>
                <p className="mt-2 text-xs text-meet-muted">
                  {hasPrepQuestions && questionSource === "prep" ? (
                    <>
                      {selectedCount} predicted questions · level from decode:{" "}
                      <span className="capitalize text-meet-text">{level}</span>
                      {" · "}
                      {pack?.roleTitle}
                      {pack?.companyName ? ` @ ${pack.companyName}` : ""}
                    </>
                  ) : hasPrepQuestions ? (
                    "Using the seeded bank (pick duration below)."
                  ) : (
                    <>
                      No active pack with selected questions.{" "}
                      <Link href="/" className="text-brand underline">
                        Continue a past pack
                      </Link>{" "}
                      or use the classic bank.
                    </>
                  )}
                </p>
                {hasPrepQuestions && questionSource === "prep" && pack ? (
                  <p className="mt-2">
                    <Link
                      href="/prep/predict?regen=1"
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Generate new question set
                    </Link>
                    <span className="text-xs text-meet-muted">
                      {" "}
                      — fresh prompts that avoid earlier ones
                    </span>
                  </p>
                ) : null}
              </div>

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
                <p className="mb-2 text-sm font-medium">Interview length</p>
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
                  {questionSource === "prep" && hasPrepQuestions
                    ? `Uses up to ${
                        duration === 15 ? 6 : duration === 25 ? 10 : 12
                      } predicted questions + intro (~${duration} min). Level from decode: ${level}.`
                    : estimateSessionCopy(duration)}
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-meet-border bg-meet-bg px-3 py-3">
                <input
                  type="checkbox"
                  checked={recordSession}
                  onChange={(e) => setRecordSession(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-meet-text">
                    Record this tab + mic
                  </span>
                  <span className="mt-0.5 block text-xs text-meet-muted">
                    Downloads a seekable WebM when you leave or finish — scrub to
                    review stutters.
                  </span>
                </span>
              </label>

              <p className="text-xs leading-relaxed text-meet-muted">
                {questionSource === "prep" && pack?.companyName ? (
                  <>
                    Company context:{" "}
                    <span className="text-meet-text">{pack.companyName}</span>
                  </>
                ) : (
                  <>
                    Practice company for “why us”:{" "}
                    <span className="text-meet-text">{DEFAULT_COMPANY.name}</span>
                    . {DEFAULT_COMPANY.blurb}
                  </>
                )}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {pack && questionSource === "prep" && !hasAllIntros(pack) ? (
                <p className="text-xs text-amber-200">
                  Practice intros missing on this pack — Start will write your
                  30 sec / 1 min / 2 min scripts (with your name) first.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={requesting || starting}
                className="w-full rounded-[8px] bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground disabled:opacity-60"
              >
                {starting
                  ? "Writing your intros…"
                  : requesting
                    ? "Requesting access…"
                    : "Start interview"}
              </button>

              {startError ? (
                <p className="text-sm text-amber-300" role="alert">
                  {startError}
                </p>
              ) : null}

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
                        {session.roleTitle || `${session.level} interview`}
                        {session.questionSource === "prep" ? " · prep" : ""}
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
    </div>
  );
}
