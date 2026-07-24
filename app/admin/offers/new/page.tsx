import { prisma } from "@/lib/prisma";
import { OfferForm } from "../_offer-form";
import { createOffer } from "../actions";

export default async function NewOfferPage() {
  const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">New venue offer</h1>
      <OfferForm action={createOffer} venues={venues} />
    </div>
  );
}
