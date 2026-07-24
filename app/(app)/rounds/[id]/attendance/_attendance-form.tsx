"use client";

import { useActionState } from "react";
import { submitAttendance } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export function AttendanceForm({
  roundId,
  attendees,
}: {
  roundId: string;
  attendees: { userId: string; displayName: string; checked: boolean }[];
}) {
  const action = submitAttendance.bind(null, roundId);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <ul className="space-y-2">
        {attendees.map((a) => (
          <li key={a.userId}>
            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                name="attendeeId"
                value={a.userId}
                defaultChecked={a.checked}
                className="rounded border-border"
              />
              {a.displayName}
            </label>
          </li>
        ))}
      </ul>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}
      {state?.ok && <p className="text-sm text-moss">Attendance saved.</p>}

      <SubmitButton>Save attendance</SubmitButton>
    </form>
  );
}
