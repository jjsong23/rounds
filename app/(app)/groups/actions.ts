"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isGroupCreationUnlocked } from "@/lib/unlocks";
import { slugify, isReservedSlug } from "@/lib/slug";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function joinGroup(groupId: string) {
  const userId = await requireUserId();

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.status !== "ACTIVE") {
    return { error: "This group isn't open to new members right now." };
  }

  await prisma.groupMembership.upsert({
    where: { userId_groupId: { userId, groupId } },
    create: { userId, groupId },
    update: {},
  });

  revalidatePath(`/groups/${group.slug}`);
  return { ok: true };
}

export type LeaveGroupState = { error?: string; needsConfirmation?: boolean } | undefined;

export async function leaveGroup(
  _prevState: LeaveGroupState,
  formData: FormData,
): Promise<LeaveGroupState> {
  const userId = await requireUserId();
  const groupId = String(formData.get("groupId") ?? "");
  const confirmed = formData.get("confirmed") === "true";

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Group not found." };

  if (!confirmed) {
    const hostingUpcoming = await prisma.round.findFirst({
      where: {
        groupId,
        hostId: userId,
        startsAt: { gte: new Date() },
        status: { in: ["OPEN", "FULL"] },
      },
    });
    if (hostingUpcoming) {
      return {
        needsConfirmation: true,
        error: `You're hosting "${hostingUpcoming.title}", an upcoming round in this group. Leaving won't cancel it, but you'll no longer be a member.`,
      };
    }
  }

  await prisma.groupMembership.deleteMany({ where: { userId, groupId } });
  revalidatePath(`/groups/${group.slug}`);
  redirect(`/groups/${group.slug}`);
}

export async function checkSlugAvailable(rawSlug: string): Promise<{ slug: string; available: boolean }> {
  const slug = slugify(rawSlug);
  if (!slug || isReservedSlug(slug)) return { slug, available: false };
  const existing = await prisma.group.findUnique({ where: { slug } });
  return { slug, available: !existing };
}

export type CreateGroupState = { error?: string } | undefined;

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Give the group a name").max(80),
  slug: z.string().trim().min(1, "Give the group a slug").max(80),
  description: z.string().trim().min(1, "Add a short description").max(2000),
  city: z.string().trim().min(1, "Add a city").max(60),
  kind: z.enum(["INDUSTRY", "SOCIAL", "ACTIVITY"]),
});

export async function createGroup(_prevState: CreateGroupState, formData: FormData): Promise<CreateGroupState> {
  const userId = await requireUserId();

  // Never trust that the client only reached this form because the unlock
  // helper said so — re-check server-side inside the action itself.
  const unlocked = await isGroupCreationUnlocked(userId);
  if (!unlocked) {
    return { error: "Group creation isn't unlocked for your account yet." };
  }

  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    city: formData.get("city"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;

  const slug = slugify(data.slug);
  if (!slug || isReservedSlug(slug)) {
    return { error: "That slug isn't available. Try something else." };
  }

  const existing = await prisma.group.findUnique({ where: { slug } });
  if (existing) {
    return { error: "That slug is already taken." };
  }

  // Re-check the group cap and slug uniqueness atomically with the create,
  // since both could have changed between the check above and now.
  const group = await prisma.$transaction(async (tx) => {
    const stillUnlocked = await isGroupCreationUnlocked(userId);
    if (!stillUnlocked) throw new Error("UNLOCK_REVOKED");

    const slugTaken = await tx.group.findUnique({ where: { slug } });
    if (slugTaken) throw new Error("SLUG_TAKEN");

    return tx.group.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        city: data.city,
        kind: data.kind,
        createdByUserId: userId,
        status: "ACTIVE",
        memberships: { create: { userId, role: "ADMIN" } },
      },
    });
  }).catch((err: Error) => {
    if (err.message === "SLUG_TAKEN") return { error: "That slug is already taken." } as const;
    if (err.message === "UNLOCK_REVOKED") return { error: "Group creation isn't unlocked for your account anymore." } as const;
    throw err;
  });

  if ("error" in group) return group;

  redirect(`/groups/${group.slug}`);
}

export async function updateGroupDescription(groupId: string, description: string) {
  const userId = await requireUserId();

  const membership = await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  if (membership?.role !== "ADMIN") throw new Error("Only a group admin can edit this.");

  const group = await prisma.group.update({ where: { id: groupId }, data: { description } });
  revalidatePath(`/groups/${group.slug}`);
}

export async function removeMember(groupId: string, memberUserId: string) {
  const userId = await requireUserId();

  const membership = await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  if (membership?.role !== "ADMIN") throw new Error("Only a group admin can remove members.");
  if (memberUserId === userId) throw new Error("Use 'Leave group' to remove yourself.");

  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  await prisma.groupMembership.deleteMany({ where: { userId: memberUserId, groupId } });
  revalidatePath(`/groups/${group.slug}`);
}

export async function adminCancelRound(groupId: string, roundId: string) {
  const userId = await requireUserId();

  const membership = await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  if (membership?.role !== "ADMIN") throw new Error("Only a group admin can cancel rounds.");

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round || round.groupId !== groupId) throw new Error("Round not found.");

  await prisma.$transaction([
    prisma.round.update({ where: { id: roundId }, data: { status: "CANCELLED" } }),
    prisma.rsvp.updateMany({
      where: { roundId, status: { in: ["GOING", "WAITLIST"] } },
      data: { status: "CANCELLED" },
    }),
  ]);

  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  revalidatePath(`/groups/${group.slug}`);
  revalidatePath(`/rounds/${roundId}`);
}
