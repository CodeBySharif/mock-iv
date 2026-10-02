"use client";

import { ApplicantVideoTile } from "@/features/session/ApplicantVideoTile";
import { ParticipantTile } from "@/features/session/ParticipantTile";
import { QuestionPanel } from "@/features/session/QuestionPanel";
import { SessionControls } from "@/features/session/SessionControls";
import { TranscriptPanel } from "@/features/session/TranscriptPanel";
import {
  createRecognition,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
} from "@/features/speech/browser-speech";
import { loadSession, loadTurns } from "@/features/report/storage";
import { useMediaStore } from "@/stores/media-store";
import { useSessionStore } from "@/stores/session-store";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SessionRoomProps = {
  sessionId: string;
};

export function SessionRoom({ sessionId }: SessionRoomProps) {
  const router = useRouter();
  const recognitionRef = useRef<ReturnType<typeof createRecognition>>(null);
  const finalBufferRef = useRef("");
  const [ready, setReady] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [liveSpeaker, setLiveSpeaker] = useState<"hr" | "technical" | null>(
    null,
  );

  const stream = useMediaStore((s) => s.stream);
  const mode = useMediaStore((s) => s.mode);
  const cameraOn = useMediaStore((s) => s.cameraOn);
  const micOn = useMediaStore((s) => s.micOn);
  const requestMedia = useMediaStore((s) => s.requestMedia);
  const toggleCamera = useMediaStore((s) => s.toggleCamera);
  const toggleMic = useMediaStore((s) => s.toggleMic);
  const stopMedia = useMediaStore((s) => s.stopMedia);

  const session = useSessionStore((s) => s.session);
  const turns = useSessionStore((s) => s.turns);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const phase = useSessionStore((s) => s.phase);
  const greetingText = useSessionStore((s) => s.greetingText);
  const thinkSecondsLeft = useSessionStore((s) => s.thinkSecondsLeft);
  const answerSecondsLeft = useSessionStore((s) => s.answerSecondsLeft);
  const answerElapsedSeconds = useSessionStore((s) => s.answerElapsedSeconds);
  const introBudget = useSessionStore((s) => s.introBudget);
  const sectionBanner = useSessionStore((s) => s.sectionBanner);
  const speechError = useSessionStore((s) => s.speechError);
  const hydrateSession = useSessionStore((s) => s.hydrateSession);
  const finishGreeting = useSessionStore((s) => s.finishGreeting);
  const setIntroBudget = useSessionStore((s) => s.setIntroBudget);
  const setTurnStatus = useSessionStore((s) => s.setTurnStatus);
  const setThinkSecondsLeft = useSessionStore((s) => s.setThinkSecondsLeft);
  const setAnswerSecondsLeft = useSessionStore((s) => s.setAnswerSecondsLeft);
  const setAnswerElapsedSeconds = useSessionStore(
    (s) => s.setAnswerElapsedSeconds,
  );
  const setTranscriptDraft = useSessionStore((s) => s.setTranscriptDraft);
  const beginAnswer = useSessionStore((s) => s.beginAnswer);
  const pauseAnswer = useSessionStore((s) => s.pauseAnswer);
  const resumeAnswer = useSessionStore((s) => s.resumeAnswer);
  const finishAnswer = useSessionStore((s) => s.finishAnswer);
  const setAcknowledgmentPlaying = useSessionStore(
    (s) => s.setAcknowledgmentPlaying,
  );
  const markFeedbackReady = useSessionStore((s) => s.markFeedbackReady);
  const goNext = useSessionStore((s) => s.goNext);
  const skipTurn = useSessionStore((s) => s.skipTurn);
  const goPrevious = useSessionStore((s) => s.goPrevious);
  const abortSession = useSessionStore((s) => s.abortSession);
  const setSpeechError = useSessionStore((s) => s.setSpeechError);
  const clearBanner = useSessionStore((s) => s.clearBanner);

  const turn = phase === "questions" ? turns[currentIndex] ?? null : null;

  useEffect(() => {
    async function boot() {
      let active = useSessionStore.getState().session;
      if (!active || active.id !== sessionId) {
        const saved = loadSession(sessionId);
        const savedTurns = loadTurns(sessionId);
        if (saved && savedTurns.length) {
          hydrateSession(saved, savedTurns);
          active = saved;
        }
      }
      if (!useMediaStore.getState().stream) {
        await requestMedia(useMediaStore.getState().mode);
      }
      setReady(true);
    }
    void boot();
  }, [hydrateSession, requestMedia, sessionId]);

  useEffect(() => {
    if (!ready || phase !== "greeting") return;
    let cancelled = false;
    const text = useSessionStore.getState().greetingText;
    const stop = speakText(text, {
      role: "hr",
      onEnd: () => {
        if (!cancelled) finishGreeting();
      },
      onError: () => {
        if (!cancelled) finishGreeting();
      },
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [ready, phase, finishGreeting]);

  useEffect(() => {
    if (!ready || phase !== "questions" || !turn || turn.status !== "asking") {
      return;
    }

    let cancelled = false;
    const stop = speakText(turn.questionText, {
      role: turn.interviewerRole,
      onEnd: () => {
        if (cancelled) return;
        setTurnStatus("thinking");
      },
      onError: () => {
        if (cancelled) return;
        setTurnStatus("thinking");
        setSpeechError("Voice playback unavailable. Read the question on screen.");
      },
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [
    ready,
    phase,
    turn?.id,
    turn?.status,
    turn?.questionText,
    turn?.interviewerRole,
    setSpeechError,
    setTurnStatus,
  ]);

  useEffect(() => {
    if (!turn || turn.status !== "thinking") return;
    if (thinkSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      const next = useSessionStore.getState().thinkSecondsLeft - 1;
      setThinkSecondsLeft(Math.max(0, next));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [turn?.status, thinkSecondsLeft, setThinkSecondsLeft]);

  useEffect(() => {
    if (!turn || turn.status !== "recording") return;
    if (answerSecondsLeft === null) return;
    if (answerSecondsLeft <= 0) {
      void submitAnswer();
      return;
    }
    const timer = window.setInterval(() => {
      const next = (useSessionStore.getState().answerSecondsLeft ?? 1) - 1;
      setAnswerSecondsLeft(Math.max(0, next));
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn?.status, answerSecondsLeft, setAnswerSecondsLeft]);

  useEffect(() => {
    if (!turn || turn.status !== "recording") return;
    const timer = window.setInterval(() => {
      const next = useSessionStore.getState().answerElapsedSeconds + 1;
      setAnswerElapsedSeconds(next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [turn?.status, setAnswerElapsedSeconds]);

  useEffect(() => {
    if (!sectionBanner) return;
    const timer = window.setTimeout(() => clearBanner(), 5000);
    return () => window.clearTimeout(timer);
  }, [sectionBanner, clearBanner]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      recognitionRef.current?.abort();
    };
  }, []);

  function stopRecognition() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
  }

  function startRecognition() {
    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        "Speech recognition needs Chrome (or another browser with Web Speech API).",
      );
      return;
    }

    setSpeechError(null);
    const recognition = createRecognition({
      onResult: (text, isFinal) => {
        if (!recognitionRef.current) return;
        if (isFinal) {
          finalBufferRef.current = [finalBufferRef.current, text]
            .filter(Boolean)
            .join(" ")
            .trim();
          setTranscriptDraft(finalBufferRef.current);
        } else {
          const draft = [finalBufferRef.current, text]
            .filter(Boolean)
            .join(" ")
            .trim();
          setTranscriptDraft(draft);
        }
      },
      onError: (message) => {
        if (message !== "aborted") {
          setSpeechError(`Speech recognition: ${message}`);
        }
      },
    });

    recognitionRef.current = recognition;
    recognition?.start();
  }

  async function startRecording() {
    const turn = useSessionStore.getState().getCurrentTurn();
    finalBufferRef.current =
      turn?.transcriptFinal?.trim() || turn?.transcriptDraft?.trim() || "";
    beginAnswer();
    startRecognition();
  }

  function pauseRecording() {
    stopRecognition();
    const turn = useSessionStore.getState().getCurrentTurn();
    const committed = (
      finalBufferRef.current ||
      turn?.transcriptDraft ||
      ""
    ).trim();
    finalBufferRef.current = committed;
    setTranscriptDraft(committed);
    pauseAnswer();
  }

  function resumeRecording() {
    const turn = useSessionStore.getState().getCurrentTurn();
    finalBufferRef.current =
      finalBufferRef.current.trim() ||
      turn?.transcriptFinal?.trim() ||
      turn?.transcriptDraft?.trim() ||
      "";
    setTranscriptDraft(finalBufferRef.current);
    resumeAnswer();
    startRecognition();
  }

  async function submitAnswer() {
    stopRecognition();
    const transcript =
      useSessionStore.getState().getCurrentTurn()?.transcriptDraft ??
      finalBufferRef.current;
    await finishAnswer(transcript);

    const state = useSessionStore.getState();
    const current = state.getCurrentTurn();
    if (!current?.acknowledgmentText) {
      markFeedbackReady();
      return;
    }

    const nextTurn = state.turns[state.currentIndex + 1];
    const speech = nextTurn
      ? `${current.acknowledgmentText} Moving on to the next question. ${nextTurn.questionText}`
      : current.acknowledgmentText;
    const role = current.interviewerRole;

    setLiveSpeaker(role);
    setAcknowledgmentPlaying();

    if (nextTurn) {
      goNext({ skipAsk: true });
    }

    speakText(speech, {
      role,
      onEnd: () => {
        setLiveSpeaker(null);
        if (nextTurn) return;
        const result = goNext();
        if (result === "complete") {
          stopMedia();
          router.push(`/report/${sessionId}`);
        } else {
          markFeedbackReady();
        }
      },
      onError: () => {
        setLiveSpeaker(null);
        markFeedbackReady();
      },
    });
  }

  function handleToggleTalk() {
    if (phase !== "questions") return;
    if (turn?.status === "recording") {
      pauseRecording();
      return;
    }
    if (turn?.status === "paused") {
      resumeRecording();
      return;
    }
    if (turn?.status === "thinking") {
      void startRecording();
    }
  }

  function handleSkip() {
    if (phase !== "questions") return;
    stopSpeaking();
    setLiveSpeaker(null);
    stopRecognition();
    const result = skipTurn();
    if (result === "complete") {
      stopMedia();
      router.push(`/report/${sessionId}`);
    }
  }

  function handleNext() {
    if (phase !== "questions") return;
    stopSpeaking();
    setLiveSpeaker(null);
    stopRecognition();
    goNext({ browse: true });
  }

  function handlePrevious() {
    if (phase !== "questions") return;
    stopSpeaking();
    setLiveSpeaker(null);
    stopRecognition();
    goPrevious({ browse: true });
  }

  function confirmAndLeave() {
    stopSpeaking();
    setLiveSpeaker(null);
    stopRecognition();
    abortSession();
    stopMedia();
    setConfirmLeave(false);
    router.push(`/report/${sessionId}`);
  }

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-meet-bg text-meet-text">
        Preparing your interview room…
      </div>
    );
  }

  const recording = turn?.status === "recording";
  const paused = turn?.status === "paused";
  const interviewerBusy = !!liveSpeaker;
  const canTalk =
    phase === "questions" &&
    !interviewerBusy &&
    (turn?.status === "thinking" ||
      turn?.status === "recording" ||
      turn?.status === "paused");
  const canSubmit =
    phase === "questions" &&
    !interviewerBusy &&
    (turn?.status === "recording" || turn?.status === "paused");
  const canSkip =
    phase === "questions" &&
    !interviewerBusy &&
    (turn?.status === "thinking" ||
      turn?.status === "recording" ||
      turn?.status === "paused" ||
      turn?.status === "asking");
  const hrSpeaking =
    liveSpeaker === "hr" ||
    phase === "greeting" ||
    ((turn?.status === "asking" || turn?.status === "acknowledgment") &&
      turn?.interviewerRole === "hr");
  const techSpeaking =
    liveSpeaker === "technical" ||
    ((turn?.status === "asking" || turn?.status === "acknowledgment") &&
      turn?.interviewerRole === "technical");

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-meet-bg text-meet-text">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-meet-border px-3 py-2 sm:px-5">
        <div>
          <p className="text-sm font-medium text-meet-text">Mock Interview</p>
          <p className="text-xs text-meet-muted capitalize">
            {session.level}
            {session.durationMinutes ? ` · ${session.durationMinutes} min plan` : ""}
            {phase === "greeting" ? " · Opening" : ` · Q${currentIndex + 1}/${turns.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          className="rounded-[8px] bg-record px-3 py-1.5 text-sm font-medium text-white"
        >
          Leave
        </button>
      </header>

      {sectionBanner ? (
        <div className="shrink-0 border-b border-brand/30 bg-brand/10 px-3 py-1.5 text-xs text-meet-text sm:px-5 sm:text-sm">
          {sectionBanner}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(140px,20%)_minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden px-2 py-2 sm:gap-4 sm:px-4 sm:py-3 md:grid-cols-[minmax(180px,22%)_minmax(0,1fr)_minmax(0,1fr)] md:px-5">
        <aside className="grid min-h-0 min-w-0 grid-rows-3 gap-3">
          <ParticipantTile
            name="You"
            roleLabel={mode === "mic-only" ? "Mic only" : "Applicant"}
            role="applicant"
            speaking={recording}
            muted={!micOn}
            subtitle={
              recording
                ? "Speaking"
                : paused
                  ? "Paused"
                  : !micOn
                    ? "Muted"
                    : mode === "mic-only"
                      ? "Mic only"
                      : "In call"
            }
          >
            {mode === "camera-mic" ? (
              <ApplicantVideoTile
                stream={stream}
                cameraOn={cameraOn}
                speaking={recording}
                fill
                showLabel={false}
              />
            ) : null}
          </ParticipantTile>
          <ParticipantTile
            name="Alex"
            roleLabel="HR"
            role="hr"
            speaking={hrSpeaking}
          />
          <ParticipantTile
            name="Sam"
            roleLabel="Technical"
            role="technical"
            speaking={!!techSpeaking}
          />
        </aside>

        <div className="min-h-0 min-w-0 overflow-hidden">
          <QuestionPanel
            phase={phase}
            greetingText={greetingText}
            turn={turn}
            thinkSecondsLeft={thinkSecondsLeft}
            answerSecondsLeft={answerSecondsLeft}
            introBudget={introBudget}
            onIntroBudgetChange={setIntroBudget}
            feedback={
              turn &&
              (turn.status === "feedback" ||
                turn.status === "acknowledgment" ||
                turn.status === "evaluating")
                ? {
                    tips: turn.tips,
                    acknowledgment: turn.acknowledgmentText,
                  }
                : undefined
            }
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <TranscriptPanel
              text={turn?.transcriptDraft || turn?.transcriptFinal || ""}
              recording={recording}
              paused={paused}
              elapsedSeconds={
                turn?.metrics?.durationMs
                  ? Math.round(turn.metrics.durationMs / 1000)
                  : answerElapsedSeconds
              }
              canSubmit={canSubmit}
              onSubmit={() => void submitAnswer()}
            />
          </div>
          {speechError ? (
            <p className="shrink-0 truncate text-xs text-amber-300" role="status">
              {speechError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-meet-border px-3 py-2 sm:px-5 sm:py-3">
        <SessionControls
          micOn={micOn}
          cameraOn={cameraOn}
          cameraAvailable={mode === "camera-mic"}
          canTalk={!!canTalk}
          recording={recording}
          paused={paused}
          canSkip={!!canSkip}
          onToggleMicTrack={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleTalk={handleToggleTalk}
          onSkip={handleSkip}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      {confirmLeave ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-title"
            className="w-full max-w-sm rounded-[12px] border border-meet-border bg-meet-surface p-5 text-meet-text"
          >
            <h2 id="leave-title" className="text-lg font-semibold">
              Leave interview?
            </h2>
            <p className="mt-2 text-sm text-meet-muted">
              Completed answers will be saved to your report.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="rounded-[8px] bg-meet-border px-3 py-2 text-sm"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={confirmAndLeave}
                className="rounded-[8px] bg-record px-3 py-2 text-sm font-medium text-white"
              >
                Leave and save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
