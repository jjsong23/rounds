"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncAttendance, isAttendanceEditable } from "@/lib/attendance";

export type AttendanceState = { error?: string; ok?: boolean } | undefined;

export async function submitAttendance(
  roundId: string,
  _prevState: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) return { error: "Round not found." };

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId, groupId: round.groupId } },
  });
  const isAuthorized = round.hostId === userId || membership?.role === "ADMIN";
  if (!isAuthorized) return { error: "Only the host or a group admin can confirm attendance." };

  if (round.startsAt.getTime() > Date.now()) {
    return { error: "You can confirm attendance once the round has started." };
  }
  if (!isAttendanceEditable(round)) {
    return { error: "This round's attendance window has closed." };
  }

  const attendeeIds = formData.getAll("attendeeId").filter((v): v is string => typeof v === "string");

  await prisma.$transaction((tx) => syncAttendance(tx, roundId, attendeeIds, userId, new Date()));

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/attendance`);
  return { ok: true };
}
