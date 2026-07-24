import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VenueForm } from "../_venue-form";
import { updateVenue } from "../actions";

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) notFound();

  const action = updateVenue.bind(null, venue.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{venue.name}</h1>
      <VenueForm action={action} initial={venue} />
    </div>
  );
}
