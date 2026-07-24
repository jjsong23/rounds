"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOfAge } from "@/lib/age";
import { DrinkPreferenceKind } from "@/generated/prisma/client";
import { DRINK_KINDS, isValidDrinkValue, type DrinkKind } from "@/lib/drink-options";

export type ActionState = { error?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return userId;
}

const ageGateSchema = z.object({
  dateOfBirth: z.coerce.date(),
  attested: z.string().optional(),
});

export async function submitAgeGate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = ageGateSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    attested: formData.get("attested"),
  });
  if (!parsed.success || Number.isNaN(parsed.data.dateOfBirth.getTime())) {
    return { error: "Enter a valid date of birth." };
  }
  if (parsed.data.attested !== "on") {
    return { error: "You must attest that this date is accurate." };
  }

  const now = new Date();
  const { dateOfBirth } = parsed.data;
  if (dateOfBirth.getTime() > now.getTime()) {
    return { error: "Date of birth can't be in the future." };
  }

  if (!isOfAge(dateOfBirth, now)) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await signOut({ redirectTo: "/onboarding/underage" });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { dateOfBirth, ageAttestedAt: now },
  });

  redirect("/onboarding/profile");
}

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  city: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(160).optional(),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function submitProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    city: formData.get("city") || undefined,
    bio: formData.get("bio") || undefined,
    avatarUrl: formData.get("avatarUrl") || "",
  });
  if (!parsed.success) {
    return { error: "Please fill in a display name (and a valid avatar URL, if provided)." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: parsed.data.displayName,
      city: parsed.data.city,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl || undefined,
    },
  });

  redirect("/onboarding/preferences");
}

export async function submitPreferences(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const selections: { kind: DrinkKind; value: string }[] = [];
  for (const kind of DRINK_KINDS) {
    for (const value of formData.getAll(kind)) {
      if (typeof value === "string" && isValidDrinkValue(kind, value)) {
        selections.push({ kind, value });
      }
    }
  }

  await prisma.$transaction([
    prisma.drinkPreference.deleteMany({ where: { userId } }),
    ...(selections.length > 0
      ? [
          prisma.drinkPreference.createMany({
            data: selections.map((s) => ({
              userId,
              kind: s.kind as DrinkPreferenceKind,
              value: s.value,
            })),
          }),
        ]
      : []),
  ]);

  redirect("/onboarding/tags");
}

export async function submitTags(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const tagIds = formData.getAll("tagId").filter((v): v is string => typeof v === "string");
  const validTags = tagIds.length
    ? await prisma.tag.findMany({ where: { id: { in: tagIds }, isActive: true }, select: { id: true } })
    : [];

  await prisma.$transaction([
    prisma.tagFollow.deleteMany({ where: { userId } }),
    ...(validTags.length > 0
      ? [
          prisma.tagFollow.createMany({
            data: validTags.map((t) => ({ userId, tagId: t.id })),
          }),
        ]
      : []),
  ]);

  redirect("/venues");
}
