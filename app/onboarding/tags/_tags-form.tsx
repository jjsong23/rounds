"use client";

import { useActionState } from "react";
import { submitTags } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/submit-button";

export function TagsForm({
  tags,
  initialTagIds,
}: {
  tags: { id: string; label: string }[];
  initialTagIds: Set<string>;
}) {
  const [state, formAction] = useActionState(submitTags, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Follow a few tags</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Rounds tagged with something you follow get boosted in your feed. You can change these anytime.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper dark:has-[:checked]:border-paper dark:has-[:checked]:bg-paper dark:has-[:checked]:text-ink"
          >
            <input
              type="checkbox"
              name="tagId"
              value={tag.id}
              defaultChecked={initialTagIds.has(tag.id)}
              className="sr-only"
            />
            {tag.label}
          </label>
        ))}
      </div>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Finish</SubmitButton>
    </form>
  );
}
