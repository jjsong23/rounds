"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelLastCall } from "./actions";

export function CancelLastCallButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await cancelLastCall(id);
          router.refresh();
        })
      }
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-ink/50 disabled:opacity-50 dark:hover:border-paper/50"
    >
      {isPending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
