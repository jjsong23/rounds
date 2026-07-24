"use client";

import { useActionState } from "react";
import type { VenueActionState } from "./actions";

type VenueValues = {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  venueType: string;
  noiseLevel: string;
  hasFlights: boolean;
  hasCommunalTables: boolean;
  hasOutdoorSeating: boolean;
  isDogFriendly: boolean;
  hasFood: boolean;
  acceptsLargeGroups: boolean;
  typicalPourPrice: number | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  outreachStatus: string;
  outreachNotes: string | null;
};

const BOOL_FIELDS = [
  ["hasFlights", "Pours flights"],
  ["hasCommunalTables", "Communal tables"],
  ["hasOutdoorSeating", "Outdoor seating"],
  ["isDogFriendly", "Dog friendly"],
  ["hasFood", "Food on site"],
  ["acceptsLargeGroups", "Accepts large groups"],
] as const;

export function VenueForm({
  action,
  initial,
}: {
  action: (state: VenueActionState, formData: FormData) => Promise<VenueActionState>;
  initial?: Partial<VenueValues>;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-3 text-sm">
      <label className="block">
        Name
        <input
          name="name"
          defaultValue={initial?.name}
          required
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>
      <label className="block">
        Address
        <input
          name="address"
          defaultValue={initial?.address}
          required
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          City
          <input
            name="city"
            defaultValue={initial?.city}
            required
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
        <label className="block">
          Lat
          <input
            name="lat"
            type="number"
            step="any"
            defaultValue={initial?.lat}
            required
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
        <label className="block">
          Lng
          <input
            name="lng"
            type="number"
            step="any"
            defaultValue={initial?.lng}
            required
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Venue type
          <select
            name="venueType"
            defaultValue={initial?.venueType ?? "BREWERY"}
            className="block w-full border border-black/30 px-2 py-1"
          >
            {["BREWERY", "TAPROOM", "BEER_GARDEN", "BREWPUB", "WINE_BAR", "TASTING_ROOM", "BOTTLE_SHOP"].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="block">
          Noise level
          <select
            name="noiseLevel"
            defaultValue={initial?.noiseLevel ?? "MODERATE"}
            className="block w-full border border-black/30 px-2 py-1"
          >
            {["QUIET", "MODERATE", "LOUD"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-1">
        {BOOL_FIELDS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input type="checkbox" name={key} defaultChecked={Boolean(initial?.[key])} />
            {label}
          </label>
        ))}
      </fieldset>

      <label className="block">
        Typical pour price
        <input
          name="typicalPourPrice"
          type="number"
          step="any"
          defaultValue={initial?.typicalPourPrice ?? undefined}
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Contact name
          <input
            name="contactName"
            defaultValue={initial?.contactName ?? undefined}
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
        <label className="block">
          Contact email
          <input
            name="contactEmail"
            defaultValue={initial?.contactEmail ?? undefined}
            className="block w-full border border-black/30 px-2 py-1"
          />
        </label>
      </div>

      <label className="block">
        Public notes{" "}
        <span className="text-xs text-neutral-500">(shown on the venue&apos;s public page)</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? undefined}
          rows={2}
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>

      <hr className="border-black/20" />
      <p className="font-bold">Outreach (internal only)</p>

      <label className="block">
        Status
        <select
          name="outreachStatus"
          defaultValue={initial?.outreachStatus ?? "PROSPECT"}
          className="block w-full border border-black/30 px-2 py-1"
        >
          {["PROSPECT", "CONTACTED", "PARTNERED", "DECLINED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        Outreach notes
        <textarea
          name="outreachNotes"
          defaultValue={initial?.outreachNotes ?? undefined}
          rows={3}
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>

      {state?.error && <p className="text-red-700">{state.error}</p>}

      <button type="submit" className="border border-black bg-black px-3 py-1.5 text-white">
        Save
      </button>
    </form>
  );
}
