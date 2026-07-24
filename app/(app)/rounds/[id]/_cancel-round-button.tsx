"use client";

import { useState, useTransition } from "react";
import { cancelRound } from "./actions";

export function CancelRoundButton({ roundId }: { roundId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="space-y-2 rounded-lg border border-brick/40 bg-brick/5 p-3 text-sm">
        <p>Cancel this round? Everyone with an RSVP will be notified it&rsquo;s off.</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => cancelRound(roundId))}
            className="rounded-lg bg-brick px-3 py-1.5 text-white disabled:opacity-50"
          >
            {isPending ? "Cancelling…" : "Cancel round"}
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
      Cancel round
    </button>
  );
}
