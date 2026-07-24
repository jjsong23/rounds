"use client";

import { useActionState } from "react";
import type { GroupActionState } from "./actions";

type GroupValues = {
  name: string;
  slug: string;
  description: string;
  city: string;
  kind: string;
  status: string;
};

export function GroupForm({
  action,
  initial,
}: {
  action: (state: GroupActionState, formData: FormData) => Promise<GroupActionState>;
  initial?: Partial<GroupValues>;
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
        Slug
        <input
          name="slug"
          defaultValue={initial?.slug}
          required
          className="block w-full border border-black/30 px-2 py-1"
        />
      </label>
      <label className="block">
        Description
        <textarea
          name="description"
          defaultValue={initial?.description}
          required
          rows={3}
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
          Kind
          <select
            name="kind"
            defaultValue={initial?.kind ?? "SOCIAL"}
            className="block w-full border border-black/30 px-2 py-1"
          >
            {["INDUSTRY", "SOCIAL", "ACTIVITY"].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Status
          <select
            name="status"
            defaultValue={initial?.status ?? "ACTIVE"}
            className="block w-full border border-black/30 px-2 py-1"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DORMANT">DORMANT</option>
          </select>
        </label>
      </div>

      {state?.error && <p className="text-red-700">{state.error}</p>}

      <button type="submit" className="border border-black bg-black px-3 py-1.5 text-white">
        Save
      </button>
    </form>
  );
}
