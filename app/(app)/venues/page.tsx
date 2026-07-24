import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isOfferCurrentlyActive, VENUE_TYPE_LABELS, NOISE_LEVEL_LABELS } from "@/lib/venues";
import { NoiseBadge } from "@/components/noise-badge";
import type { Prisma } from "@/generated/prisma/client";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const VENUE_TYPES = Object.keys(VENUE_TYPE_LABELS);
const NOISE_LEVELS = Object.keys(NOISE_LEVEL_LABELS);

const BOOLEAN_FILTERS = [
  { key: "hasFlights", label: "Pours flights" },
  { key: "hasOutdoorSeating", label: "Outdoor seating" },
  { key: "isDogFriendly", label: "Dog friendly" },
  { key: "hasFood", label: "Food on site" },
  { key: "acceptsLargeGroups", label: "Accepts large groups" },
] as const;

export default async function VenuesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const cities = await prisma.venue.findMany({
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });

  const city = first(params.city) ?? user?.city ?? undefined;
  const venueType = first(params.venueType) || undefined;
  const noiseLevel = first(params.noiseLevel) || undefined;

  const where: Prisma.VenueWhereInput = {
    ...(city ? { city } : {}),
    ...(venueType ? { venueType: venueType as Prisma.EnumVenueTypeFilter["equals"] } : {}),
    ...(noiseLevel ? { noiseLevel: noiseLevel as Prisma.EnumNoiseLevelFilter["equals"] } : {}),
  };
  for (const f of BOOLEAN_FILTERS) {
    if (first(params[f.key]) === "1") {
      (where as Record<string, unknown>)[f.key] = true;
    }
  }

  const venues = await prisma.venue.findMany({
    where,
    include: {
      offers: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Venues</h1>
        <p className="text-sm text-foreground/60">
          Breweries, taprooms, beer gardens, wine bars, and tasting rooms — the venues built for lingering
          conversation.
        </p>
      </div>

      <form className="space-y-4 rounded-xl border border-border p-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Noise level</label>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper dark:has-[:checked]:border-paper dark:has-[:checked]:bg-paper dark:has-[:checked]:text-ink">
              <input
                type="radio"
                name="noiseLevel"
                value=""
                defaultChecked={!noiseLevel}
                className="sr-only"
              />
              Any
            </label>
            {NOISE_LEVELS.map((level) => (
              <label
                key={level}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper dark:has-[:checked]:border-paper dark:has-[:checked]:bg-paper dark:has-[:checked]:text-ink"
              >
                <input
                  type="radio"
                  name="noiseLevel"
                  value={level}
                  defaultChecked={noiseLevel === level}
                  className="sr-only"
                />
                {NOISE_LEVEL_LABELS[level]}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="city" className="text-sm font-medium">
              City
            </label>
            <select
              id="city"
              name="city"
              defaultValue={city ?? ""}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Any city</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="venueType" className="text-sm font-medium">
              Venue type
            </label>
            <select
              id="venueType"
              name="venueType"
              defaultValue={venueType ?? ""}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Any type</option>
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {VENUE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {BOOLEAN_FILTERS.map((f) => (
            <label key={f.key} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name={f.key}
                value="1"
                defaultChecked={first(params[f.key]) === "1"}
                className="rounded border-border"
              />
              {f.label}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          Apply filters
        </button>
      </form>

      {venues.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground/60">
          No venues match those filters yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {venues.map((venue) => {
            const hasOffer = venue.offers.some((o) => isOfferCurrentlyActive(o));
            return (
              <Link
                key={venue.id}
                href={`/venues/${venue.slug}`}
                className="block rounded-xl border border-border p-4 transition hover:border-ink/30 dark:hover:border-paper/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{venue.name}</h2>
                    <p className="text-sm text-foreground/60">
                      {VENUE_TYPE_LABELS[venue.venueType]} · {venue.city}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <NoiseBadge level={venue.noiseLevel} />
                  </span>
                </div>

                <p className="mt-3 text-xs text-foreground/70">
                  {[
                    venue.hasFlights && "Flights",
                    venue.hasCommunalTables && "Communal tables",
                    venue.hasOutdoorSeating && "Patio",
                    venue.isDogFriendly && "Dog friendly",
                    venue.hasFood && "Food",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {hasOffer && <p className="mt-3 text-xs font-medium text-moss">● Active venue offer</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
