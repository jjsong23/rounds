import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatInZone } from "@/lib/datetime";
import { CADENCE_LABELS } from "@/lib/series";
import { CancelOccurrenceButton, EndSeriesButton } from "./_host-controls";

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const series = await prisma.roundSeries.findUnique({
    where: { id },
    include: {
      venue: true,
      group: true,
      host: true,
      rounds: {
        orderBy: { startsAt: "asc" },
        include: { attendances: { include: { user: true } } },
      },
    },
  });
  if (!series) notFound();

  const now = new Date();
  const upcoming = series.rounds.filter(
    (r) => r.startsAt >= now && (r.status === "OPEN" || r.status === "FULL"),
  );
  const isHost = user?.id === series.hostId;

  const attendanceCounts = new Map<string, { count: number; displayName: string }>();
  for (const round of series.rounds) {
    for (const attendance of round.attendances) {
      const entry = attendanceCounts.get(attendance.userId) ?? {
        count: 0,
        displayName: attendance.user.displayName ?? "",
      };
      entry.count += 1;
      attendanceCounts.set(attendance.userId, entry);
    }
  }
  const regulars = Array.from(attendanceCounts.values())
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/groups/${series.group.slug}`} className="text-sm text-foreground/60 hover:underline">
          ← {series.group.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{series.venue.name}</h1>
        <p className="text-sm text-foreground/60">
          {CADENCE_LABELS[series.cadence]} · hosted by {series.host.displayName}
          {!series.isActive && " · Ended"}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Next occurrences</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">No upcoming occurrences scheduled.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((round) => (
              <li
                key={round.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <Link href={`/rounds/${round.id}`} className="hover:underline">
                  {formatInZone(round.startsAt)}
                </Link>
                {isHost && series.isActive && (
                  <CancelOccurrenceButton seriesId={series.id} roundId={round.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border-2 border-ink p-5 dark:border-paper">
        <h2 className="text-lg font-semibold">The Regulars</h2>
        <p className="text-sm text-foreground/60">People who&rsquo;ve shown up 2 or more times.</p>
        {regulars.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            No regulars yet — takes a couple rounds to build a crowd.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-3">
            {regulars.map((r) => (
              <li
                key={r.displayName}
                className="flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
              >
                {r.displayName}
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs dark:bg-black/10">
                  {r.count}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isHost && series.isActive && (
        <div>
          <EndSeriesButton seriesId={series.id} />
        </div>
      )}
    </div>
  );
}
