import type { Prisma, SeriesCadence } from "@/generated/prisma/client";
import { nextSeriesOccurrence } from "@/lib/datetime";

// Keeps at most 2 unstarted Round rows per active series. Called both right
// after a series is created and again whenever an occurrence completes, so
// the series never runs dry and never bulk-generates a year of phantom
// rounds up front.
export async function ensureUpcomingOccurrences(tx: Prisma.TransactionClient, seriesId: string) {
  const series = await tx.roundSeries.findUniqueOrThrow({ where: { id: seriesId } });
  if (!series.isActive) return;

  const now = new Date();
  const unstarted = await tx.round.findMany({
    where: { seriesId, startsAt: { gte: now }, status: { in: ["OPEN", "FULL"] } },
    orderBy: { startsAt: "desc" },
  });

  let latest = unstarted[0]?.startsAt ?? null;
  const needed = 2 - unstarted.length;

  for (let i = 0; i < needed; i++) {
    const startsAt = latest
      ? nextSeriesOccurrence(latest, series.cadence)
      : nextSeriesOccurrence(now, series.cadence);

    if (series.endsAt && startsAt > series.endsAt) break;

    const created = await tx.round.create({
      data: {
        groupId: series.groupId,
        hostId: series.hostId,
        venueId: series.venueId,
        seriesId: series.id,
        title: await seriesRoundTitle(tx, series.id),
        description: "",
        startsAt,
        capacity: 6,
      },
    });
    latest = created.startsAt;
  }
}

async function seriesRoundTitle(tx: Prisma.TransactionClient, seriesId: string): Promise<string> {
  const anyRound = await tx.round.findFirst({ where: { seriesId }, orderBy: { startsAt: "asc" } });
  return anyRound?.title ?? "Recurring round";
}

export const CADENCE_LABELS: Record<SeriesCadence, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every other week",
  MONTHLY: "Every 4 weeks",
};
