"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureUpcomingOccurrences } from "@/lib/series";

async function requireHost(seriesId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");

  const series = await prisma.roundSeries.findUnique({ where: { id: seriesId } });
  if (!series) throw new Error("Series not found.");
  if (series.hostId !== userId) throw new Error("Only the host can manage this series.");
  return series;
}

export async function cancelOccurrence(seriesId: string, roundId: string) {
  await requireHost(seriesId);

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round || round.seriesId !== seriesId) throw new Error("Occurrence not found.");
  if (round.startsAt.getTime() < Date.now()) throw new Error("Can't cancel a round that already started.");

  await prisma.$transaction(async (tx) => {
    await tx.round.update({ where: { id: roundId }, data: { status: "CANCELLED" } });
    await tx.rsvp.updateMany({
      where: { roundId, status: { in: ["GOING", "WAITLIST"] } },
      data: { status: "CANCELLED" },
    });
    await ensureUpcomingOccurrences(tx, seriesId);
  });

  revalidatePath(`/series/${seriesId}`);
}

export async function endSeries(seriesId: string) {
  await requireHost(seriesId);

  await prisma.$transaction(async (tx) => {
    await tx.roundSeries.update({ where: { id: seriesId }, data: { isActive: false } });

    const unstarted = await tx.round.findMany({
      where: { seriesId, startsAt: { gte: new Date() }, status: { in: ["OPEN", "FULL"] } },
    });
    for (const round of unstarted) {
      await tx.round.update({ where: { id: round.id }, data: { status: "CANCELLED" } });
      await tx.rsvp.updateMany({
        where: { roundId: round.id, status: { in: ["GOING", "WAITLIST"] } },
        data: { status: "CANCELLED" },
      });
    }
  });

  revalidatePath(`/series/${seriesId}`);
}
