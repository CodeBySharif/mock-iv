"use client";

import { useEffect, useRef } from "react";

type ApplicantVideoTileProps = {
  stream: MediaStream | null;
  cameraOn: boolean;
  speaking?: boolean;
  fill?: boolean;
  showLabel?: boolean;
};

export function ApplicantVideoTile({
  stream,
  cameraOn,
  speaking = false,
  fill = false,
  showLabel = true,
}: ApplicantVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] border bg-meet-surface ${
        fill ? "h-full min-h-[100px]" : "aspect-video"
      } ${speaking ? "speak-active border-brand" : "border-meet-border"}`}
    >
      {stream && cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
      ) : (
        <div className="flex h-full min-h-24 items-center justify-center text-sm text-meet-muted">
          Camera off
        </div>
      )}
      {showLabel ? (
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-meet-text">
          You
        </span>
      ) : null}
    </div>
  );
}
