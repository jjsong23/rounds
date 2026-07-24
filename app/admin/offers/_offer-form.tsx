"use client";

import { useActionState } from "react";
import type { OfferActionState } from "./actions";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type OfferValues = {
  venueId: string;
  title: string;
  terms: string;
  minPartySize: number;
  validDays: number[];
  validFromHour: number;
  validToHour: number;
  startsOn: Date;
  endsOn: Date | null;
  isActive: boolean;
};

export function OfferForm({
  action,
  venues,
  initial,
}: {
  action: (state: OfferActionState, formData: FormData) => Promise<OfferActionState>;
  venues: { id: string; name: string }[];
  initial?: Partial<OfferValues>;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-3 text-sm">
      <label className="block">
        Venue
        <select
          name="venueId"
          defaultValue={initial?.venueId}
          required
          className="block w-full border border-black/30 px-2 py-1"
        >
          <option value="" disabled>
            Select a venue
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Title
        <input
          name="title"
          defaultValue={initial?.title}
          required
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>
      <label className="block">
        Terms (venue&rsquo;s own words)
        <textarea
          name="terms"
          defaultValue={initial?.terms}
          required
          rows={2}
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>
      <label className="block">
        Minimum party size
        <input
          name="minPartySize"
          type="number"
          min={1}
          defaultValue={initial?.minPartySize ?? 6}
          required
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>

      <fieldset>
        <legend>Valid days</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => (
            <label key={i} className="flex items-center gap-1">
              <input
                type="checkbox"
                name="validDays"
                value={i}
                defaultChecked={initial?.validDays?.includes(i)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Valid from (hour, 0-23)
          <input
            name="validFromHour"
            type="number"
            min={0}
            max={23}
            defaultValue={initial?.validFromHour ?? 16}
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
        <label className="block">
          Valid to (hour, 1-24)
          <input
            name="validToHour"
            type="number"
            min={1}
            max={24}
            defaultValue={initial?.validToHour ?? 19}
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Starts on
          <input
            name="startsOn"
            type="date"
            defaultValue={initial?.startsOn ? initial.startsOn.toISOString().slice(0, 10) : undefined}
            required
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
        <label className="block">
          Ends on (optional)
          <input
            name="endsOn"
            type="date"
            defaultValue={initial?.endsOn ? initial.endsOn.toISOString().slice(0, 10) : undefined}
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
        Active
      </label>

      {state?.error && <p className="text-red-700">{state.error}</p>}

      <button type="submit" className="border border-black bg-black px-3 py-1.5 text-white">
        Save
      </button>
    </form>
  );
}
