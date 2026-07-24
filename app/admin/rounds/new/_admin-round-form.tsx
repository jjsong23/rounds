"use client";

import { useActionState, useState } from "react";
import { adminCreateRound, type AdminRoundActionState } from "../actions";

export function AdminRoundForm({
  users,
  groups,
  venues,
}: {
  users: { id: string; displayName: string | null; email: string }[];
  groups: { id: string; name: string }[];
  venues: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<AdminRoundActionState, FormData>(adminCreateRound, undefined);
  const [locationMode, setLocationMode] = useState<"venue" | "text">("venue");

  return (
    <form action={formAction} className="max-w-xl space-y-3 text-sm">
      <label className="block">
        Host (on behalf of)
        <select name="hostId" required className="block w-full border border-black/30 px-2 py-1">
          <option value="" disabled>
            Select a user
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName ?? u.email}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Group
        <select name="groupId" required className="block w-full border border-black/30 px-2 py-1">
          <option value="" disabled>
            Select a group
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span>Where</span>
        <div className="flex gap-3">
          <label>
            <input
              type="radio"
              checked={locationMode === "venue"}
              onChange={() => setLocationMode("venue")}
            />{" "}
            Venue
          </label>
          <label>
            <input type="radio" checked={locationMode === "text"} onChange={() => setLocationMode("text")} />{" "}
            Free text
          </label>
        </div>
        {locationMode === "venue" ? (
          <select name="venueId" required className="block w-full border border-black/30 px-2 py-1">
            <option value="" disabled>
              Select a venue
            </option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        ) : (
          <input name="locationText" required className="block w-full border border-black/30 px-2 py-1" />
        )}
      </div>

      <label className="block">
        Title
        <input name="title" required className="block w-full border border-black/30 px-2 py-1" />
      </label>
      <label className="block">
        Description
        <textarea name="description" rows={2} className="block w-full border border-black/30 px-2 py-1" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Date & time
          <input
            name="startsAt"
            type="datetime-local"
            required
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
        <label className="block">
          Capacity
          <input
            name="capacity"
            type="number"
            min={2}
            max={12}
            defaultValue={6}
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
      </div>

      {state?.error && <p className="text-red-700">{state.error}</p>}

      <button type="submit" className="border border-black bg-black px-3 py-1.5 text-white">
        Create round
      </button>
    </form>
  );
}
