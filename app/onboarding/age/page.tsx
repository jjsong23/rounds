"use client";

import { useActionState } from "react";
import { submitAgeGate } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/submit-button";

export default function AgeGatePage() {
  const [state, formAction] = useActionState(submitAgeGate, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rounds is 21+</h1>
        <p className="mt-2 text-sm text-foreground/70">
          We ask for your date of birth once, to confirm you&rsquo;re old enough for the venues we work
          with.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="dateOfBirth" className="block text-sm font-medium">
          Date of birth
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="attested" className="mt-1" required />
        <span>I attest that this date of birth is accurate.</span>
      </label>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Continue</SubmitButton>
    </form>
  );
}
