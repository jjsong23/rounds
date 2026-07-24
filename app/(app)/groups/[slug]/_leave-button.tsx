"use client";

import { useActionState, useState } from "react";
import { leaveGroup } from "@/app/(app)/groups/actions";

export function LeaveButton({ groupId }: { groupId: string }) {
  const [state, formAction] = useActionState(leaveGroup, undefined);
  const [dismissed, setDismissed] = useState(false);

  if (state?.needsConfirmation && !dismissed) {
    return (
      <form
        action={formAction}
        className="space-y-2 rounded-lg border border-brick/40 bg-brick/5 p-3 text-sm"
      >
        <p>{state.error}</p>
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="confirmed" value="true" />
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-brick px-3 py-1.5 text-white">
            Leave anyway
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-border px-3 py-1.5"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="groupId" value={groupId} />
      <button
        type="submit"
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-ink/50 dark:hover:border-paper/50"
      >
        Leave group
      </button>
    </form>
  );
}
