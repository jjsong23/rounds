"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToLastCall } from "../actions";

const OPTIONS = [
  { value: "COMING", label: "Coming" },
  { value: "MAYBE", label: "Maybe" },
  { value: "DECLINED", label: "Can't make it" },
] as const;

export function RespondButtons({ id, currentStatus }: { id: string; currentStatus: string | null }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await respondToLastCall(id, option.value);
              router.refresh();
            })
          }
          className={`rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            currentStatus === option.value
              ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
              : "border-border"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
