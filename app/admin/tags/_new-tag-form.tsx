"use client";

import { useActionState } from "react";
import { createTag } from "./actions";

export function NewTagForm() {
  const [state, formAction] = useActionState(createTag, undefined);
  return (
    <form action={formAction} className="flex items-center gap-2 text-sm">
      <input name="label" placeholder="New tag label" required className="border border-black/30 px-2 py-1" />
      <button type="submit" className="border border-black bg-black px-3 py-1 text-white">
        Add tag
      </button>
      {state?.error && <span className="text-red-700">{state.error}</span>}
    </form>
  );
}
