"use client";

import { useState, useTransition } from "react";
import { cancelOccurrence, endSeries } from "./actions";

export function CancelOccurrenceButton({ seriesId, roundId }: { seriesId: string; roundId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => cancelOccurrence(seriesId, roundId))}
      className="text-xs text-brick hover:underline disabled:opacity-50"
    >
      {isPending ? "Cancelling…" : "Cancel this one"}
    </button>
  );
}

export function EndSeriesButton({ seriesId }: { seriesId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="space-y-2 rounded-lg border border-brick/40 bg-brick/5 p-3 text-sm">
        <p>
          End this series? Upcoming occurrences will be cancelled. Past rounds and attendance stay intact.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => endSeries(seriesId))}
            className="rounded-lg bg-brick px-3 py-1.5 text-white disabled:opacity-50"
          >
            {isPending ? "Ending…" : "End series"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-border px-3 py-1.5"
          >
            Never mind
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-brick/50 px-4 py-2 text-sm font-medium text-brick hover:border-brick"
    >
      End series
    </button>
  );
}
