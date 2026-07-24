"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleLastCall } from "@/lib/last-call";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return userId;
}

export type ActionState = { error?: string } | undefined;

const createSchema = z
  .object({
    venueId: z.string().optional(),
    locationText: z.string().trim().max(200).optional(),
    message: z.string().trim().max(280).optional(),
    durationHours: z.coerce.number().int().min(1).max(3),
  })
  .refine((data) => Boolean(data.venueId) !== Boolean(data.locationText), {
    message: "Pick a venue, or describe where you are, but not both.",
    path: ["venueId"],
  });

export async function createLastCall(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = createSchema.safeParse({
    venueId: formData.get("venueId") || undefined,
    locationText: formData.get("locationText") || undefined,
    message: formData.get("message") || undefined,
    durationHours: formData.get("durationHours"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;

  const existingActive = await prisma.lastCall.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
  });
  if (existingActive) {
    return { error: "You already have an active Last Call. Cancel it before posting a new one." };
  }

  const expiresAt = new Date(Date.now() + data.durationHours * 60 * 60 * 1000);

  const created = await prisma.lastCall.create({
    data: {
      userId,
      venueId: data.venueId,
      locationText: data.locationText,
      message: data.message,
      expiresAt,
    },
  });

  revalidatePath("/last-call");
  redirect(`/last-call/${created.id}`);
}

export async function cancelLastCall(id: string) {
  const userId = await requireUserId();

  const lastCall = await prisma.lastCall.findUnique({ where: { id } });
  if (!lastCall || lastCall.userId !== userId) throw new Error("Not found.");

  await prisma.lastCall.update({ where: { id }, data: { expiresAt: new Date() } });
  revalidatePath("/last-call");
  revalidatePath(`/last-call/${id}`);
}

const RESPONSE_STATUSES = ["COMING", "MAYBE", "DECLINED"] as const;

export async function respondToLastCall(id: string, status: (typeof RESPONSE_STATUSES)[number]) {
  const userId = await requireUserId();
  if (!RESPONSE_STATUSES.includes(status)) throw new Error("Invalid status.");

  const lastCall = await getVisibleLastCall(id, userId);
  if (!lastCall) throw new Error("Not found.");

  await prisma.lastCallResponse.upsert({
    where: { lastCallId_userId: { lastCallId: id, userId } },
    create: { lastCallId: id, userId, status },
    update: { status },
  });

  revalidatePath(`/last-call/${id}`);
}
