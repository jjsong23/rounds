import { prisma } from "@/lib/prisma";
import { LastCallForm } from "./_last-call-form";

export default async function NewLastCallPage() {
  const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });
  return <LastCallForm venues={venues} />;
}
