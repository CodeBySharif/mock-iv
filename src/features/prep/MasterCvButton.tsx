"use client";

import {
  hasMasterCv,
  MASTER_CV_EVENT,
} from "@/features/prep/master-cv-storage";
import { useEffect, useState } from "react";

type MasterCvButtonProps = {
  onClick: () => void;
};

export function MasterCvButton({ onClick }: MasterCvButtonProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setReady(hasMasterCv());
    refresh();
    window.addEventListener(MASTER_CV_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(MASTER_CV_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm font-medium hover:border-brand"
      aria-label={ready ? "Master CV on file" : "Master CV missing"}
      title={ready ? "Master CV saved" : "No master CV yet"}
    >
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          backgroundColor: ready ? "#34d399" : "#ef4444",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
        }}
        aria-hidden
      />
      Master CV
    </button>
  );
}
