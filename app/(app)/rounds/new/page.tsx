import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { RoundForm } from "./_round-form";

export default async function NewRoundPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; venueId?: string }>;
}) {
  const { groupId, venueId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [memberships, venues, tags] = await Promise.all([
    prisma.groupMembership.findMany({
      where: { userId: user.id, group: { status: "ACTIVE" } },
      include: { group: true },
      orderBy: { group: { name: "asc" } },
    }),
    prisma.venue.findMany({ include: { offers: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { isActive: true }, orderBy: { label: "asc" } }),
  ]);

  const groups = memberships.map((m) => m.group);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-foreground/60">
          You need to join a group before you can host a round.{" "}
          <Link href="/groups" className="underline underline-offset-4">
            Browse groups
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <RoundForm
      groups={groups}
      venues={venues}
      tags={tags}
      initialGroupId={groupId}
      initialVenueId={venueId}
    />
  );
}
