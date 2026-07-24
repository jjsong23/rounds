"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { reviveGroup } from "@/lib/dormancy";
import { zonedTimeToUtc } from "@/lib/datetime";

export type AdminRoundActionState = { error?: string } | undefined;

const schema = z
  .object({
    groupId: z.string().min(1),
    hostId: z.string().min(1),
    venueId: z.string().optional(),
    locationText: z.string().trim().max(200).optional(),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).optional(),
    startsAt: z.string().min(1),
    capacity: z.coerce.number().int().min(2).max(12),
  })
  .refine((d) => Boolean(d.venueId) !== Boolean(d.locationText), {
    message: "Pick a venue or a location, not both.",
    path: ["venueId"],
  });

export async function adminCreateRound(
  _prevState: AdminRoundActionState,
  formData: FormData,
): Promise<AdminRoundActionState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    groupId: formData.get("groupId"),
    hostId: formData.get("hostId"),
    venueId: formData.get("venueId") || undefined,
    locationText: formData.get("locationText") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const data = parsed.data;
  const startsAt = zonedTimeToUtc(data.startsAt);

  const round = await prisma.$transaction(async (tx) => {
    const created = await tx.round.create({
      data: {
        groupId: data.groupId,
        hostId: data.hostId,
        venueId: data.venueId,
        locationText: data.locationText,
        title: data.title,
        description: data.description ?? "",
        startsAt,
        capacity: data.capacity,
      },
    });

    await tx.groupMembership.upsert({
      where: { userId_groupId: { userId: data.hostId, groupId: data.groupId } },
      create: { userId: data.hostId, groupId: data.groupId, role: "HOST" },
      update: {},
    });

    await reviveGroup(tx, data.groupId, startsAt);
    return created;
  });

  redirect(`/rounds/${round.id}`);
}
