import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { matchesOffer } from "@/lib/offers";
import { OfferForm } from "../_offer-form";
import { updateOffer } from "../actions";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [offer, venues] = await Promise.all([
    prisma.venueOffer.findUnique({ where: { id }, include: { venue: true } }),
    prisma.venue.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!offer) notFound();

  const upcomingRounds = await prisma.round.findMany({
    where: { venueId: offer.venueId, startsAt: { gte: new Date() }, status: { in: ["OPEN", "FULL"] } },
    include: { group: true, rsvps: { where: { status: "GOING" } } },
    orderBy: { startsAt: "asc" },
  });
  const matches = upcomingRounds.filter((r) =>
    matchesOffer(
      { venueId: r.venueId!, startsAt: r.startsAt, partySize: Math.max(r.capacity, r.rsvps.length) },
      offer,
    ),
  );

  const action = updateOffer.bind(null, offer.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">
        {offer.title} — {offer.venue.name}
      </h1>
      <OfferForm
        action={action}
        venues={venues}
        initial={{ ...offer, validDays: Array.isArray(offer.validDays) ? (offer.validDays as number[]) : [] }}
      />

      <div>
        <h2 className="font-bold">Upcoming rounds that would match</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-neutral-600">None right now.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {matches.map((r) => (
              <li key={r.id}>
                <Link href={`/rounds/${r.id}`} className="underline">
                  {r.title}
                </Link>{" "}
                — {r.group.name} — {r.startsAt.toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
