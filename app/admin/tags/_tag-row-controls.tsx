"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameTag, setTagActive } from "./actions";

export function TagRowControls({
  tagId,
  label,
  isActive,
}: {
  tagId: string;
  label: string;
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border border-black/30 px-1 py-0.5 text-sm"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await renameTag(tagId, value);
              setEditing(false);
              router.refresh();
            })
          }
          className="underline"
        >
          save
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {label}
      <button type="button" onClick={() => setEditing(true)} className="text-xs underline">
        rename
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setTagActive(tagId, !isActive);
            router.refresh();
          })
        }
        className="text-xs underline"
      >
        {isActive ? "deactivate" : "activate"}
      </button>
    </span>
  );
}
