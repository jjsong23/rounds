"use client";

import { useActionState } from "react";
import { rsvpToRound, cancelRsvp, type RsvpState } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export function RsvpControl({
  roundId,
  myStatus,
  spotsLeft,
  waitlistPosition,
}: {
  roundId: string;
  myStatus: "GOING" | "WAITLIST" | null;
  spotsLeft: number;
  waitlistPosition: number | null;
}) {
  const [rsvpState, rsvpAction] = useActionState<RsvpState, FormData>(rsvpToRound, undefined);
  const [cancelState, cancelAction] = useActionState<RsvpState, FormData>(cancelRsvp, undefined);

  const state = rsvpState ?? cancelState;

  if (myStatus === "GOING" || myStatus === "WAITLIST") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {myStatus === "GOING"
            ? "You're going."
            : `You're on the waitlist${waitlistPosition ? ` (#${waitlistPosition})` : ""}.`}
        </p>
        <form action={cancelAction}>
          <input type="hidden" name="roundId" value={roundId} />
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-ink/50 dark:hover:border-paper/50"
          >
            {myStatus === "GOING" ? "Cancel my spot" : "Leave waitlist"}
          </button>
        </form>
        {state?.error && <p className="text-sm text-brick">{state.error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form action={rsvpAction}>
        <input type="hidden" name="roundId" value={roundId} />
        <SubmitButton>
          {spotsLeft > 0 ? `RSVP — ${spotsLeft} seat${spotsLeft === 1 ? "" : "s"} left` : "Join the waitlist"}
        </SubmitButton>
      </form>
      {state?.confirmation && <p className="text-sm text-moss">{state.confirmation}</p>}
      {state?.error && <p className="text-sm text-brick">{state.error}</p>}
    </div>
  );
}
