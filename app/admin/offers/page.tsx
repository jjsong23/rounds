import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isOfferCurrentlyActive } from "@/lib/venues";

export default async function AdminOffersPage() {
  const offers = await prisma.venueOffer.findMany({
    include: { venue: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Venue offers</h1>
        <Link href="/admin/offers/new" className="underline">
          + New offer
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="py-1 pr-2">Venue</th>
            <th className="py-1 pr-2">Title</th>
            <th className="py-1 pr-2">Min party</th>
            <th className="py-1 pr-2">Currently live</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id} className="border-b border-black/10">
              <td className="py-1 pr-2">{o.venue.name}</td>
              <td className="py-1 pr-2">
                <Link href={`/admin/offers/${o.id}`} className="underline">
                  {o.title}
                </Link>
              </td>
              <td className="py-1 pr-2">{o.minPartySize}+</td>
              <td className="py-1 pr-2">{isOfferCurrentlyActive(o) ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
