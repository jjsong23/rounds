"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createGroup, checkSlugAvailable } from "@/app/(app)/groups/actions";
import { SubmitButton } from "@/components/submit-button";
import { slugify } from "@/lib/slug";

export function CreateGroupForm() {
  const [state, formAction] = useActionState(createGroup, undefined);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugCheck, setSlugCheck] = useState<{ slug: string; available: boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveSlug = slugEdited ? slug : name;
  // Derived at render time rather than reset via setState in the effect:
  // once effectiveSlug no longer matches the last-checked slug, treat the
  // stale result as if there were none.
  const displayedCheck = slugCheck && slugCheck.slug === slugify(effectiveSlug) ? slugCheck : null;

  useEffect(() => {
    if (!effectiveSlug.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await checkSlugAvailable(effectiveSlug);
      setSlugCheck(result);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [effectiveSlug]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Create a group</h1>
        <p className="mt-1 text-sm text-foreground/60">
          You&rsquo;re accountable for this one — you&rsquo;ll be its admin.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          maxLength={80}
          value={displayedCheck?.slug ?? effectiveSlug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
        {displayedCheck && (
          <p className={`text-xs ${displayedCheck.available ? "text-moss" : "text-brick"}`}>
            {displayedCheck.available
              ? `rounds.app/groups/${displayedCheck.slug} is available`
              : "That slug isn&rsquo;t available"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="city" className="text-sm font-medium">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            maxLength={60}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="kind" className="text-sm font-medium">
            Kind
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue="SOCIAL"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="INDUSTRY">Industry</option>
            <option value="SOCIAL">Social</option>
            <option value="ACTIVITY">Activity</option>
          </select>
        </div>
      </div>

      {state?.error && <p className="text-sm text-brick">{state.error}</p>}

      <SubmitButton>Create group</SubmitButton>
    </form>
  );
}
