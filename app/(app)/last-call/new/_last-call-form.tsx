"use client";

import { useActionState, useState } from "react";
import { createLastCall, type ActionState } from "@/app/(app)/last-call/actions";
import { SubmitButton } from "@/components/submit-button";

export function LastCallForm({ venues }: { venues: { id: string; name: string; city: string }[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createLastCall, undefined);
  const [locationMode, setLocationMode] = useState<"venue" | "text">("venue");

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Post a Last Call</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Only visible to people you&rsquo;ve actually shared a round with. &ldquo;Two seats at the
          bar&rdquo; energy.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Where are you</span>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setLocationMode("venue")}
            className={`rounded-full border px-3 py-1 ${
              locationMode === "venue"
                ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
                : "border-border"
            }`}
          >
            Pick a venue
          </button>
          <button
            type="button"
            onClick={() => setLocationMode("text")}
            className={`rounded-full border px-3 py-1 ${
              locationMode === "text"
                ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
                : "border-border"
            }`}
          >
            Describe it
          </button>
        </div>

        {locationMode === "venue" ? (
          <select
            name="venueId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Search the directory
            </option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.city}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="locationText"
            required
            placeholder="At the bar at Denizens"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Message <span className="font-normal text-foreground/60">(optional)</span>
        </label>
        <input
          id="message"
          name="message"
          maxLength={280}
          placeholder="Two seats at the bar, they just tapped the saison"
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">How long</legend>
        <div className="flex gap-2 text-sm">
          {[1, 2, 3].map((hours) => (
            <label
              key={hours}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper dark:has-[:checked]:border-paper dark:has-[:checked]:bg-paper dark:has-[:checked]:text-ink"
            >
              <input
                type="radio"
                name="durationHours"
                value={hours}
                defaultChecked={hours === 1}
                className="sr-only"
              />
              {hours} hour{hours === 1 ? "" : "s"}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Post</SubmitButton>
    </form>
  );
}
