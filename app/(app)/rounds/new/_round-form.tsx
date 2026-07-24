"use client";

import { useActionState, useMemo, useState } from "react";
import { createRound, type ActionState } from "@/app/(app)/rounds/actions";
import { SubmitButton } from "@/components/submit-button";
import { matchesOffer, describeOfferMatch } from "@/lib/offers";
import { zonedTimeToUtc } from "@/lib/datetime";
import type { VenueOffer } from "@/generated/prisma/client";

type Group = { id: string; name: string };
type Venue = { id: string; name: string; city: string; offers: VenueOffer[] };
type Tag = { id: string; label: string };

export function RoundForm({
  groups,
  venues,
  tags,
  initialGroupId,
  initialVenueId,
}: {
  groups: Group[];
  venues: Venue[];
  tags: Tag[];
  initialGroupId?: string;
  initialVenueId?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createRound, undefined);
  const [locationMode, setLocationMode] = useState<"venue" | "text">("venue");
  const [venueId, setVenueId] = useState(initialVenueId ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState(6);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [repeats, setRepeats] = useState(false);

  const offerPreview = useMemo(() => {
    if (locationMode !== "venue" || !venueId || !startsAt) return null;
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return null;
    const date = zonedTimeToUtc(startsAt);
    if (Number.isNaN(date.getTime())) return null;
    const match = venue.offers.find((offer) =>
      matchesOffer({ venueId, startsAt: date, partySize: capacity }, offer),
    );
    return match ? describeOfferMatch(match, capacity) : null;
  }, [locationMode, venueId, startsAt, capacity, venues]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Host a round</h1>
        <p className="mt-1 text-sm text-foreground/60">
          A specific group, at a specific place, at a specific time, with a capacity cap.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="groupId" className="text-sm font-medium">
          Group
        </label>
        <select
          id="groupId"
          name="groupId"
          required
          defaultValue={initialGroupId ?? ""}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choose a group you belong to
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Where</span>
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
            Describe the location
          </button>
        </div>

        {locationMode === "venue" ? (
          <select
            name="venueId"
            required
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
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
            placeholder="e.g. Meet at the corner of Fenton & Ellsworth"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          />
        )}

        {offerPreview && <p className="rounded-lg bg-moss/10 px-3 py-2 text-sm text-moss">{offerPreview}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={100}
          placeholder="After-work flights at Denizens"
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="startsAt" className="text-sm font-medium">
            Date & time
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capacity" className="text-sm font-medium">
            Capacity
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={2}
            max={12}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isFlightFocused" className="rounded border-border" />
        This one&rsquo;s about the flights
      </label>

      {locationMode === "venue" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Repeat</legend>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { value: "NONE", label: "One-time" },
              { value: "WEEKLY", label: "Weekly" },
              { value: "BIWEEKLY", label: "Every other week" },
              { value: "MONTHLY", label: "Every 4 weeks" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper dark:has-[:checked]:border-paper dark:has-[:checked]:bg-paper dark:has-[:checked]:text-ink"
              >
                <input
                  type="radio"
                  name="repeat"
                  value={option.value}
                  defaultChecked={option.value === "NONE"}
                  onChange={() => setRepeats(option.value !== "NONE")}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {repeats && (
            <div className="space-y-1.5">
              <label htmlFor="seriesEndsAt" className="text-sm text-foreground/60">
                Ends on <span className="font-normal">(optional)</span>
              </label>
              <input
                id="seriesEndsAt"
                name="seriesEndsAt"
                type="date"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Tags <span className="font-normal text-foreground/60">(pick 1–3)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const checked = selectedTagIds.includes(tag.id);
            const disabled = !checked && selectedTagIds.length >= 3;
            return (
              <label
                key={tag.id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                  checked
                    ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
                    : "border-border"
                } ${disabled ? "opacity-40" : ""}`}
              >
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => {
                    setSelectedTagIds((prev) =>
                      e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id),
                    );
                  }}
                  className="sr-only"
                />
                {tag.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Post round</SubmitButton>
    </form>
  );
}
