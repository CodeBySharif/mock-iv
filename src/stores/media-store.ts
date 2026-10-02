"use client";

import { create } from "zustand";

export type MediaMode = "camera-mic" | "mic-only";

type MediaState = {
  mode: MediaMode;
  stream: MediaStream | null;
  cameraOn: boolean;
  micOn: boolean;
  error: string | null;
  requesting: boolean;
  setMode: (mode: MediaMode) => void;
  requestMedia: (mode?: MediaMode) => Promise<boolean>;
  toggleCamera: () => void;
  toggleMic: () => void;
  stopMedia: () => void;
};

export const useMediaStore = create<MediaState>((set, get) => ({
  mode: "mic-only",
  stream: null,
  cameraOn: false,
  micOn: true,
  error: null,
  requesting: false,

  setMode: (mode) => {
    const { stream } = get();
    if (stream) get().stopMedia();
    set({ mode, error: null, cameraOn: mode === "camera-mic" });
  },

  requestMedia: async (modeArg) => {
    const mode = modeArg ?? get().mode;
    set({ requesting: true, error: null, mode });

    const constraints: MediaStreamConstraints =
      mode === "camera-mic"
        ? { audio: true, video: { facingMode: "user" } }
        : { audio: true, video: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      get().stopMedia();
      set({
        stream,
        mode,
        cameraOn: mode === "camera-mic",
        micOn: true,
        requesting: false,
        error: null,
      });
      return true;
    } catch (error) {
      if (mode === "camera-mic") {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          get().stopMedia();
          set({
            stream: audioOnly,
            mode: "mic-only",
            cameraOn: false,
            micOn: true,
            requesting: false,
            error: null,
          });
          return true;
        } catch {
          // fall through to error below
        }
      }

      const message =
        error instanceof Error ? error.message : "Permission denied";
      set({
        requesting: false,
        error: message,
        stream: null,
      });
      return false;
    }
  },

  toggleCamera: () => {
    const { stream, cameraOn, mode } = get();
    if (mode !== "camera-mic") return;
    const tracks = stream?.getVideoTracks() ?? [];
    if (tracks.length === 0) return;
    tracks.forEach((track) => {
      track.enabled = !cameraOn;
    });
    set({ cameraOn: !cameraOn });
  },

  toggleMic: () => {
    const { stream, micOn } = get();
    stream?.getAudioTracks().forEach((track) => {
      track.enabled = !micOn;
    });
    set({ micOn: !micOn });
  },

  stopMedia: () => {
    const { stream } = get();
    stream?.getTracks().forEach((track) => track.stop());
    set({ stream: null, cameraOn: false, micOn: false });
  },
}));
