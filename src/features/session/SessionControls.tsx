"use client";

type SessionControlsProps = {
  micOn: boolean;
  cameraOn: boolean;
  cameraAvailable: boolean;
  canTalk: boolean;
  recording: boolean;
  paused: boolean;
  canSkip: boolean;
  onToggleMicTrack: () => void;
  onToggleCamera: () => void;
  onToggleTalk: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function SessionControls({
  micOn,
  cameraOn,
  cameraAvailable,
  canTalk,
  recording,
  paused,
  canSkip,
  onToggleMicTrack,
  onToggleCamera,
  onToggleTalk,
  onSkip,
  onPrevious,
  onNext,
}: SessionControlsProps) {
  const talkLabel = recording ? "Pause" : "Talk to answer";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-[24px] bg-meet-surface px-3 py-2 sm:gap-3">
      <button
        type="button"
        onClick={onToggleMicTrack}
        aria-pressed={!micOn}
        className={`flex h-9 min-w-[4.75rem] items-center justify-center rounded-[8px] px-3 text-sm font-medium text-meet-text hover:bg-[#5f6368] ${
          micOn ? "bg-meet-border" : "bg-record text-white hover:bg-record"
        }`}
      >
        {micOn ? "Mute" : "Unmute"}
      </button>

      {cameraAvailable ? (
        <button
          type="button"
          onClick={onToggleCamera}
          aria-pressed={!cameraOn}
          className="flex h-9 min-w-[4.75rem] items-center justify-center rounded-[8px] bg-meet-border px-3 text-sm font-medium text-meet-text hover:bg-[#5f6368]"
        >
          {cameraOn ? "Cam off" : "Cam on"}
        </button>
      ) : null}

      <button
        type="button"
        disabled={!canTalk && !recording && !paused}
        onClick={onToggleTalk}
        className={`flex h-9 min-w-[8.5rem] items-center justify-center rounded-[8px] px-4 text-sm font-semibold disabled:opacity-40 ${
          recording
            ? "bg-amber-500 text-black"
            : "bg-brand text-brand-foreground"
        }`}
      >
        {talkLabel}
      </button>

      <button
        type="button"
        disabled={!canSkip}
        onClick={onSkip}
        className="flex h-9 min-w-[5rem] items-center justify-center rounded-[8px] bg-meet-border px-3 text-sm font-medium text-meet-text disabled:opacity-40"
      >
        Skip
      </button>

      <button
        type="button"
        onClick={onPrevious}
        className="flex h-9 min-w-[6rem] items-center justify-center rounded-[8px] bg-meet-border px-3 text-sm font-medium text-meet-text"
      >
        Previous
      </button>

      <button
        type="button"
        onClick={onNext}
        className="flex h-9 min-w-[6.5rem] items-center justify-center rounded-[8px] bg-meet-border px-3 text-sm font-medium text-meet-text"
      >
        Next question
      </button>
    </div>
  );
}
