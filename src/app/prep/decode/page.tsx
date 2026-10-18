import { DecodeScreen } from "@/features/prep/DecodeScreen";
import { Suspense } from "react";

export default function DecodePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-meet-bg text-meet-muted">
          Loading decode…
        </div>
      }
    >
      <DecodeScreen />
    </Suspense>
  );
}
