import fixWebmDuration from "fix-webm-duration";
import { saveSessionRecording } from "@/features/session/recording-store";

export type SessionRecorderHandle = {
  stop: () => Promise<Blob | null>;
  isRecording: () => boolean;
};

function pickMimeType() {
  // Prefer broadly playable containers/codecs first.
  const candidates = [
    "video/mp4",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Keep URL alive longer so the OS shell can finish writing the file.
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

/**
 * Records current tab video + mic audio.
 * Avoids timesliced WebM (often unplayable); patches duration; saves locally + IndexedDB.
 */
export async function startSessionRecorder(options: {
  sessionId: string;
  micStream: MediaStream | null;
  fileNameBase: string;
}): Promise<SessionRecorderHandle> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen recording is not supported in this browser.");
  }

  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: 15,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: true,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  } as DisplayMediaStreamOptions);

  const videoTrack = displayStream.getVideoTracks()[0];
  if (!videoTrack) {
    displayStream.getTracks().forEach((t) => t.stop());
    throw new Error("No video track from screen share.");
  }

  // Mix mic (preferred) + optional tab audio into one audio track for a valid A/V file.
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  let hasAudio = false;

  const micTrack = options.micStream?.getAudioTracks()[0];
  if (micTrack && micTrack.readyState === "live") {
    const micStream = new MediaStream([micTrack]);
    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);
    hasAudio = true;
  }

  const tabAudio = displayStream.getAudioTracks()[0];
  if (tabAudio && tabAudio.readyState === "live") {
    const tabStream = new MediaStream([tabAudio]);
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    const gain = audioContext.createGain();
    gain.gain.value = 0.35;
    tabSource.connect(gain);
    gain.connect(destination);
    hasAudio = true;
  }

  const tracks: MediaStreamTrack[] = [videoTrack];
  if (hasAudio) {
    tracks.push(...destination.stream.getAudioTracks());
  }

  const combined = new MediaStream(tracks);
  const mimeType = pickMimeType();
  const chunks: Blob[] = [];
  const startedAt = performance.now();

  const recorder = new MediaRecorder(
    combined,
    mimeType
      ? { mimeType, videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 128_000 }
      : { videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 128_000 },
  );

  let resolveStop: ((blob: Blob | null) => void) | null = null;
  const stopped = new Promise<Blob | null>((resolve) => {
    resolveStop = resolve;
  });

  const cleanupMedia = () => {
    try {
      displayStream.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    void audioContext.close().catch(() => undefined);
  };

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  recorder.onerror = () => {
    cleanupMedia();
    resolveStop?.(null);
  };

  recorder.onstop = () => {
    void (async () => {
      try {
        if (chunks.length === 0) {
          cleanupMedia();
          resolveStop?.(null);
          return;
        }

        const actualMime =
          recorder.mimeType || mimeType || chunks[0]?.type || "video/webm";
        let blob = new Blob(chunks, { type: actualMime });
        const durationMs = Math.max(1000, performance.now() - startedAt);

        if (actualMime.includes("webm")) {
          try {
            const fixed = await fixWebmDuration(blob, durationMs, {
              logger: false,
            });
            if (fixed && fixed.size > 0) blob = fixed;
          } catch {
            // Keep raw blob if patch fails.
          }
        }

        const fileName = `${options.fileNameBase}.${extensionForMime(actualMime)}`;
        try {
          await saveSessionRecording({
            sessionId: options.sessionId,
            blob,
            fileName,
          });
        } catch {
          // IndexedDB optional — still download.
        }

        downloadBlob(blob, fileName);
        resolveStop?.(blob);
      } finally {
        cleanupMedia();
      }
    })();
  };

  videoTrack.addEventListener("ended", () => {
    if (recorder.state !== "inactive") {
      try {
        recorder.requestData();
      } catch {
        // ignore
      }
      recorder.stop();
    }
  });

  // No timeslice — one final blob is more reliably playable than chunked WebM.
  recorder.start();

  return {
    isRecording: () => recorder.state === "recording",
    stop: async () => {
      if (recorder.state === "inactive") return stopped;
      try {
        recorder.requestData();
      } catch {
        // ignore
      }
      recorder.stop();
      return stopped;
    },
  };
}

export function recordingFileNameBase(sessionId: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `mock-iv-${sessionId}-${stamp}`;
}

/** @deprecated Use recordingFileNameBase — kept so stale HMR bundles don't crash. */
export const recordingFileName = recordingFileNameBase;
