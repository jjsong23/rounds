import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isOfferCurrentlyActive, VENUE_TYPE_LABELS } from "@/lib/venues";
import { NoiseBadge } from "@/components/noise-badge";

export default async function VenueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const venue = await prisma.venue.findUnique({
    where: { slug },
    include: {
      offers: true,
      rounds: {
        where: { startsAt: { gte: new Date() }, status: { in: ["OPEN", "FULL"] } },
        orderBy: { startsAt: "asc" },
        include: { host: true, roundTags: { include: { tag: true } } },
      },
    },
  });

  if (!venue) notFound();

  const activeOffer = venue.offers.find((o) => isOfferCurrentlyActive(o));
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${venue.lng - 0.006}%2C${
    venue.lat - 0.006
  }%2C${venue.lng + 0.006}%2C${venue.lat + 0.006}&layer=mapnik&marker=${venue.lat}%2C${venue.lng}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/venues" className="text-sm text-foreground/60 hover:underline">
          ← Back to venues
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{venue.name}</h1>
            <p className="text-sm text-foreground/60">
              {VENUE_TYPE_LABELS[venue.venueType]} · {venue.address}
            </p>
          </div>
          <span className="shrink-0">
            <NoiseBadge level={venue.noiseLevel} />
          </span>
        </div>
      </div>

      <Link
        href={`/rounds/new?venueId=${venue.id}`}
        className="inline-block rounded-lg bg-amber px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90"
      >
        Host a round here
      </Link>

      <p className="text-sm text-foreground/70">
        {[
          venue.hasFlights && "Pours flights",
          venue.hasCommunalTables && "Communal tables",
          venue.hasOutdoorSeating && "Outdoor seating",
          venue.isDogFriendly && "Dog friendly",
          venue.hasFood && "Food on site",
          venue.acceptsLargeGroups && "Accepts large groups",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {activeOffer && (
        <div className="rounded-xl border border-moss/40 bg-moss/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">{venue.name}&rsquo;s offer</p>
          <p className="mt-1 font-medium">{activeOffer.title}</p>
          <p className="mt-1 text-sm text-foreground/80">{activeOffer.terms}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <iframe title={`Map showing ${venue.name}`} src={mapSrc} className="h-64 w-full" loading="lazy" />
      </div>

      {venue.notes && <p className="text-sm text-foreground/70">{venue.notes}</p>}

      <div>
        <h2 className="text-lg font-semibold">Upcoming rounds here</h2>
        {venue.rounds.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">
            No rounds scheduled here yet — be the first to host one.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {venue.rounds.map((round) => (
              <li key={round.id}>
                <Link
                  href={`/rounds/${round.id}`}
                  className="block rounded-lg border border-border p-3 hover:border-ink/30 dark:hover:border-paper/30"
                >
                  <p className="font-medium">{round.title}</p>
                  <p className="text-sm text-foreground/60">
                    {round.startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} ·
                    hosted by {round.host.displayName}
                  </p>
                  {round.roundTags.length > 0 && (
                    <p className="mt-1 text-xs text-foreground/60">
                      {round.roundTags.map((rt) => rt.tag.label).join(" · ")}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
