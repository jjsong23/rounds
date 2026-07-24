"use client";

import { useActionState } from "react";
import { submitProfile } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForm({
  initialDisplayName,
  initialAvatarUrl,
}: {
  initialDisplayName: string;
  initialAvatarUrl: string;
}) {
  const [state, formAction] = useActionState(submitProfile, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Tell us a bit about you</h1>
        <p className="mt-2 text-sm text-foreground/70">
          This is what people see before they show up to a round with you.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="block text-sm font-medium">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={initialDisplayName}
          required
          maxLength={60}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="city" className="block text-sm font-medium">
          City
        </label>
        <input
          id="city"
          name="city"
          placeholder="Silver Spring"
          maxLength={60}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium">
          One-line bio
        </label>
        <input
          id="bio"
          name="bio"
          placeholder="New to town, into sours and quiet patios."
          maxLength={160}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="avatarUrl" className="block text-sm font-medium">
          Avatar URL <span className="font-normal text-foreground/60">(optional)</span>
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={initialAvatarUrl}
          placeholder="https://…"
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
        />
      </div>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Continue</SubmitButton>
    </form>
  );
}
