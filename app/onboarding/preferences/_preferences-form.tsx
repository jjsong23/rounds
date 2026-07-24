"use client";

import { useActionState } from "react";
import { submitPreferences } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/submit-button";
import { DRINK_OPTION_GROUPS } from "@/lib/drink-options";

export function PreferencesForm({ initialValues }: { initialValues: Set<string> }) {
  const [state, formAction] = useActionState(submitPreferences, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">What do you like to drink?</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Pick as many as you like. Non-alcoholic options are just as valid a choice as anything else here.
        </p>
      </div>

      {DRINK_OPTION_GROUPS.map((group) => (
        <fieldset key={group.kind} className="space-y-2">
          <legend className="text-sm font-medium">{group.label}</legend>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const key = `${group.kind}:${option.value}`;
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper dark:has-[:checked]:border-paper dark:has-[:checked]:bg-paper dark:has-[:checked]:text-ink"
                >
                  <input
                    type="checkbox"
                    name={group.kind}
                    value={option.value}
                    defaultChecked={initialValues.has(key)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Continue</SubmitButton>
    </form>
  );
}
