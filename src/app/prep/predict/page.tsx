import { PredictScreen } from "@/features/prep/PredictScreen";
import { Suspense } from "react";

export default function PredictPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-meet-bg text-sm text-meet-muted">
          Loading…
        </div>
      }
    >
      <PredictScreen />
    </Suspense>
  );
}
