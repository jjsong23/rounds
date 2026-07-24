import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { matchesOffer, describeOfferMatch } from "@/lib/offers";
import { formatInZone, now } from "@/lib/datetime";
import { RsvpControl } from "./_rsvp-control";
import { CancelRoundButton } from "./_cancel-round-button";
import { TagPill } from "@/components/tag-pill";
import { NoiseBadge } from "@/components/noise-badge";
import { FlightDots } from "@/components/flight-dots";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  FULL: "Full",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export default async function RoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      group: true,
      host: true,
      venue: { include: { offers: true } },
      roundTags: { include: { tag: true } },
      rsvps: {
        where: { status: { in: ["GOING", "WAITLIST"] } },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!round) notFound();

  const going = round.rsvps.filter((r) => r.status === "GOING");
  const waitlist = round.rsvps.filter((r) => r.status === "WAITLIST");
  const spotsLeft = Math.max(0, round.capacity - going.length);
  const isHost = user?.id === round.hostId;
  const myRsvp = user ? round.rsvps.find((r) => r.userId === user.id) : undefined;
  const myWaitlistPosition =
    myRsvp?.status === "WAITLIST" ? waitlist.findIndex((r) => r.id === myRsvp.id) + 1 : null;

  const activeOffer = round.venue?.offers.find((offer) =>
    matchesOffer({ venueId: round.venue!.id, startsAt: round.startsAt, partySize: round.capacity }, offer),
  );

  const isPast = round.startsAt.getTime() < now().getTime();
  const isCancellable = isHost && !isPast && round.status !== "CANCELLED" && round.status !== "COMPLETED";

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/groups/${round.group.slug}`} className="text-sm text-foreground/60 hover:underline">
          ← {round.group.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{round.title}</h1>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium">
            {STATUS_LABELS[round.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground/60">
          {formatInZone(round.startsAt)} · hosted by {round.host.displayName}
        </p>
        {round.seriesId && (
          <Link
            href={`/series/${round.seriesId}`}
            className="mt-1 inline-block text-xs text-foreground/60 hover:underline"
          >
            Part of a recurring series →
          </Link>
        )}
      </div>

      {round.description && <p className="text-sm text-foreground/80">{round.description}</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        {round.isFlightFocused && (
          <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-medium text-paper">
            Flight tasting
          </span>
        )}
        {round.roundTags.map((rt) => (
          <TagPill key={rt.tagId} href={`/tags/${rt.tag.slug}`}>
            {rt.tag.label}
          </TagPill>
        ))}
      </div>

      <div className="rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground/60">Where</h2>
        {round.venue ? (
          <>
            <Link href={`/venues/${round.venue.slug}`} className="mt-1 block font-medium hover:underline">
              {round.venue.name}
            </Link>
            <p className="text-sm text-foreground/60">{round.venue.address}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/70">
              <NoiseBadge level={round.venue.noiseLevel} />
              <span>
                {[
                  round.venue.hasFlights && "Flights",
                  round.venue.hasOutdoorSeating && "Patio",
                  round.venue.isDogFriendly && "Dog friendly",
                  round.venue.hasFood && "Food",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </>
        ) : (
          <p className="mt-1">{round.locationText}</p>
        )}
      </div>

      {activeOffer && (
        <div className="rounded-xl border border-moss/40 bg-moss/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">
            {round.venue?.name}&rsquo;s offer
          </p>
          <p className="mt-1 text-sm text-foreground/80">{describeOfferMatch(activeOffer, round.capacity)}</p>
        </div>
      )}

      {isPast || round.status === "CANCELLED" || round.status === "COMPLETED" ? (
        <p className="text-sm text-foreground/60">
          {round.status === "CANCELLED" ? "This round was cancelled." : "This round has already happened."}
        </p>
      ) : (
        <RsvpControl
          roundId={round.id}
          myStatus={myRsvp ? (myRsvp.status as "GOING" | "WAITLIST") : null}
          spotsLeft={spotsLeft}
          waitlistPosition={myWaitlistPosition}
        />
      )}

      <div className="flex flex-wrap gap-3">
        {isCancellable && <CancelRoundButton roundId={round.id} />}
        {isHost && isPast && round.status !== "CANCELLED" && (
          <Link
            href={`/rounds/${round.id}/attendance`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-ink/50 dark:hover:border-paper/50"
          >
            Confirm attendance
          </Link>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Who&rsquo;s going</h2>
          <FlightDots filled={going.length} total={round.capacity} />
          <span className="text-sm text-foreground/60">
            {going.length}/{round.capacity}
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-3">
          {going.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-medium dark:bg-paper/10">
                {r.user.displayName?.[0]?.toUpperCase() ?? "?"}
              </span>
              {r.user.displayName}
            </li>
          ))}
        </ul>
        {waitlist.length > 0 && (
          <p className="mt-2 text-xs text-foreground/60">{waitlist.length} on the waitlist</p>
        )}
      </div>
    </div>
  );
}
