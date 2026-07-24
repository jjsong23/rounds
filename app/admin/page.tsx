import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const rounds = await prisma.round.findMany({
    where: { status: { in: ["OPEN", "FULL"] }, startsAt: { gte: new Date() } },
    include: { group: true, venue: true, rsvps: { where: { status: "GOING" } } },
    orderBy: { startsAt: "asc" },
  });

  const withFillRatio = rounds.map((r) => ({
    round: r,
    goingCount: r.rsvps.length,
    fillRatio: r.rsvps.length / r.capacity,
  }));
  withFillRatio.sort((a, b) => a.fillRatio - b.fillRatio);

  const recentGroups = await prisma.group.findMany({
    where: { createdByUserId: { not: null } },
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const cancelledHostRounds = await prisma.round.findMany({
    where: { status: "CANCELLED", host: { createdGroups: { some: {} } } },
    include: { host: { include: { createdGroups: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const flaggedGroups = new Map<string, { groupName: string; hostName: string }>();
  for (const r of cancelledHostRounds) {
    for (const g of r.host.createdGroups) {
      flaggedGroups.set(g.id, { groupName: g.name, hostName: r.host.displayName ?? "" });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <section>
        <h2 className="font-bold">Upcoming rounds, by fill risk</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left">
              <th className="py-1 pr-2">Round</th>
              <th className="py-1 pr-2">Group</th>
              <th className="py-1 pr-2">Venue</th>
              <th className="py-1 pr-2">Starts</th>
              <th className="py-1 pr-2">Going</th>
            </tr>
          </thead>
          <tbody>
            {withFillRatio.map(({ round, goingCount }) => (
              <tr key={round.id} className="border-b border-black/10">
                <td className="py-1 pr-2">
                  <Link href={`/rounds/${round.id}`} className="underline">
                    {round.title}
                  </Link>
                </td>
                <td className="py-1 pr-2">{round.group.name}</td>
                <td className="py-1 pr-2">{round.venue?.name ?? round.locationText}</td>
                <td className="py-1 pr-2">{round.startsAt.toLocaleString()}</td>
                <td className="py-1 pr-2">
                  {goingCount}/{round.capacity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-bold">Moderation queue</h2>
        <h3 className="mt-2 text-sm font-semibold">Recently created user groups</h3>
        <ul className="list-disc pl-5 text-sm">
          {recentGroups.map((g) => (
            <li key={g.id}>
              <Link href={`/admin/groups/${g.id}`} className="underline">
                {g.name}
              </Link>{" "}
              — created by {g.createdBy?.displayName} on {g.createdAt.toLocaleDateString()}
            </li>
          ))}
        </ul>

        <h3 className="mt-4 text-sm font-semibold">Groups whose creator has had a round cancelled</h3>
        {flaggedGroups.size === 0 ? (
          <p className="text-sm text-neutral-600">None.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {Array.from(flaggedGroups.entries()).map(([id, info]) => (
              <li key={id}>
                <Link href={`/admin/groups/${id}`} className="underline">
                  {info.groupName}
                </Link>{" "}
                — creator {info.hostName} had a round cancelled
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
