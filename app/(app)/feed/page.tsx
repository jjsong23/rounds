import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatInZone } from "@/lib/datetime";
import { VENUE_TYPE_LABELS } from "@/lib/venues";
import type { Prisma } from "@/generated/prisma/client";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; venueType?: string; from?: string; to?: string }>;
}) {
  const { tag, venueType, from, to } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const groupIds = user.groupMemberships.map((m) => m.groupId);
  const followedTagIds = new Set(user.tagFollows.map((f) => f.tagId));

  if (groupIds.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border p-8 text-center">
        <h1 className="text-xl font-semibold">Your feed is empty</h1>
        <p className="text-sm text-foreground/60">
          You&rsquo;re not in any groups yet. Browse the venue directory or join a group to start seeing
          rounds here.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/venues"
            className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            Browse venues
          </Link>
          <Link href="/groups" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Browse groups
          </Link>
        </div>
      </div>
    );
  }

  const allTags = await prisma.tag.findMany({ where: { isActive: true }, orderBy: { label: "asc" } });

  const rangeStart = from ? new Date(from) : new Date();
  const where: Prisma.RoundWhereInput = {
    groupId: { in: groupIds },
    startsAt: { gte: rangeStart, ...(to ? { lte: new Date(to) } : {}) },
    status: { in: ["OPEN", "FULL"] },
    ...(tag ? { roundTags: { some: { tag: { slug: tag } } } } : {}),
    ...(venueType ? { venue: { venueType: venueType as Prisma.EnumVenueTypeFilter["equals"] } } : {}),
  };

  const rounds = await prisma.round.findMany({
    where,
    include: {
      venue: true,
      group: true,
      host: true,
      roundTags: { include: { tag: true } },
      rsvps: { where: { status: "GOING" } },
    },
    orderBy: { startsAt: "asc" },
  });

  const withBoost = rounds.map((round) => ({
    round,
    boosted: round.roundTags.some((rt) => followedTagIds.has(rt.tagId)),
  }));
  withBoost.sort((a, b) => Number(b.boosted) - Number(a.boosted));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feed</h1>
        <p className="text-sm text-foreground/60">Upcoming rounds across your groups.</p>
      </div>

      <form className="flex flex-wrap gap-3">
        <select
          name="tag"
          defaultValue={tag ?? ""}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Any tag</option>
          {allTags.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          name="venueType"
          defaultValue={venueType ?? ""}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Any venue type</option>
          {Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          Filter
        </button>
      </form>

      {withBoost.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-foreground/60">No upcoming rounds match yet.</p>
          <Link
            href="/rounds/new"
            className="inline-block rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            Host a round
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {withBoost.map(({ round, boosted }) => {
            const spotsLeft = Math.max(0, round.capacity - round.rsvps.length);
            return (
              <li key={round.id}>
                <Link
                  href={`/rounds/${round.id}`}
                  className={`block rounded-xl border p-4 transition hover:border-ink/30 dark:hover:border-paper/30 ${
                    boosted ? "border-ink dark:border-paper" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {round.title}{" "}
                        {boosted && (
                          <span className="ml-1 text-xs font-normal text-foreground/60">· followed tag</span>
                        )}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {formatInZone(round.startsAt)} · {round.group.name}
                        {round.venue
                          ? ` · ${round.venue.name}`
                          : round.locationText
                            ? ` · ${round.locationText}`
                            : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground/60">
                      {round.status === "FULL" ? "Full" : `${spotsLeft} left`}
                    </span>
                  </div>
                  {round.roundTags.length > 0 && (
                    <p className="mt-2 text-xs text-foreground/60">
                      {round.roundTags.map((rt) => rt.tag.label).join(" · ")}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
