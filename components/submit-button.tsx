"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-amber px-4 py-2.5 font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
