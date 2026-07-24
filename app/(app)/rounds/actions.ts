"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviveGroup } from "@/lib/dormancy";
import { zonedTimeToUtc, getZonedParts, APP_TIME_ZONE } from "@/lib/datetime";
import { ensureUpcomingOccurrences } from "@/lib/series";

export type ActionState = { error?: string } | undefined;

function localDayOfWeek(date: Date): number {
  const p = getZonedParts(date, APP_TIME_ZONE);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return userId;
}

const createRoundSchema = z
  .object({
    groupId: z.string().min(1, "Choose a group"),
    venueId: z.string().optional(),
    locationText: z.string().trim().max(200).optional(),
    title: z.string().trim().min(1, "Give the round a title").max(100),
    description: z.string().trim().max(2000).optional(),
    startsAt: z.string().min(1, "Pick a date and time"),
    capacity: z.coerce.number().int().min(2).max(12),
    isFlightFocused: z.boolean(),
    tagIds: z.array(z.string()).min(1, "Pick at least one tag").max(3, "Pick at most three tags"),
    repeat: z.enum(["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("NONE"),
    seriesEndsAt: z.string().optional(),
  })
  .refine((data) => Boolean(data.venueId) !== Boolean(data.locationText), {
    message: "Pick a venue from the directory, or describe the location, but not both.",
    path: ["venueId"],
  })
  .refine((data) => data.repeat === "NONE" || Boolean(data.venueId), {
    message: "Recurring rounds need a venue from the directory, not a free-text location.",
    path: ["repeat"],
  });

export async function createRound(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = createRoundSchema.safeParse({
    groupId: formData.get("groupId"),
    venueId: formData.get("venueId") || undefined,
    locationText: formData.get("locationText") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    capacity: formData.get("capacity"),
    isFlightFocused: formData.get("isFlightFocused") === "on",
    tagIds: formData.getAll("tagIds"),
    repeat: formData.get("repeat") || "NONE",
    seriesEndsAt: formData.get("seriesEndsAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;
  const startsAt = zonedTimeToUtc(data.startsAt);

  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
    return { error: "Pick a date and time in the future." };
  }

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId, groupId: data.groupId } },
  });
  if (!membership) {
    return { error: "You need to be a member of this group to host a round in it." };
  }

  if (data.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
    if (!venue) return { error: "That venue couldn't be found." };
  }

  const validTags = await prisma.tag.findMany({
    where: { id: { in: data.tagIds }, isActive: true },
    select: { id: true },
  });
  if (validTags.length !== data.tagIds.length) {
    return { error: "One of those tags isn't available anymore. Refresh and try again." };
  }

  const seriesEndsAt = data.seriesEndsAt ? zonedTimeToUtc(`${data.seriesEndsAt}T23:59`) : undefined;

  const round = await prisma.$transaction(async (tx) => {
    let seriesId: string | undefined;
    if (data.repeat !== "NONE") {
      const series = await tx.roundSeries.create({
        data: {
          groupId: data.groupId,
          hostId: userId,
          venueId: data.venueId!,
          cadence: data.repeat,
          dayOfWeek: localDayOfWeek(startsAt),
          timeOfDay: data.startsAt.split("T")[1] ?? "18:00",
          endsAt: seriesEndsAt,
        },
      });
      seriesId = series.id;
    }

    const created = await tx.round.create({
      data: {
        groupId: data.groupId,
        hostId: userId,
        venueId: data.venueId,
        locationText: data.locationText,
        seriesId,
        title: data.title,
        description: data.description ?? "",
        startsAt,
        capacity: data.capacity,
        isFlightFocused: data.isFlightFocused,
        roundTags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      },
    });

    if (membership.role === "MEMBER") {
      await tx.groupMembership.update({
        where: { id: membership.id },
        data: { role: "HOST" },
      });
    }

    await reviveGroup(tx, data.groupId, startsAt);

    if (seriesId) {
      await ensureUpcomingOccurrences(tx, seriesId);
    }

    return created;
  });

  redirect(`/rounds/${round.id}`);
}
