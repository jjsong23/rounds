"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGroupDescription, removeMember, adminCancelRound } from "@/app/(app)/groups/actions";

export function EditDescriptionForm({
  groupId,
  initialDescription,
}: {
  groupId: string;
  initialDescription: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialDescription);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-foreground/60 hover:underline"
      >
        Edit description
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateGroupDescription(groupId, value);
              setEditing(false);
              router.refresh();
            })
          }
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(initialDescription);
            setEditing(false);
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function RemoveMemberButton({ groupId, memberUserId }: { groupId: string; memberUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await removeMember(groupId, memberUserId);
          router.refresh();
        })
      }
      className="ml-1 text-xs text-brick hover:underline disabled:opacity-50"
    >
      remove
    </button>
  );
}

export function AdminCancelRoundButton({ groupId, roundId }: { groupId: string; roundId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await adminCancelRound(groupId, roundId);
          router.refresh();
        });
      }}
      className="text-xs text-brick hover:underline disabled:opacity-50"
    >
      {isPending ? "Cancelling…" : "Cancel round"}
    </button>
  );
}
