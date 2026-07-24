import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function PeoplePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const edges = await prisma.edge.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    orderBy: { lastMetAt: "desc" },
  });

  const partnerIds = edges.map((e) => (e.userAId === user.id ? e.userBId : e.userAId));
  const partners = await prisma.user.findMany({ where: { id: { in: partnerIds } } });
  const partnerById = new Map(partners.map((p) => [p.id, p]));

  const myAttendance = await prisma.attendance.findMany({
    where: { userId: user.id },
    include: { round: { include: { venue: true } } },
  });
  const myRoundVenues = new Map<string, string>();
  for (const a of myAttendance) {
    if (a.round.venue?.name) myRoundVenues.set(a.roundId, a.round.venue.name);
  }

  const sharedVenuesByPartner = new Map<string, Set<string>>();
  if (partnerIds.length > 0) {
    const partnerAttendance = await prisma.attendance.findMany({
      where: { userId: { in: partnerIds }, roundId: { in: [...myRoundVenues.keys()] } },
    });
    for (const a of partnerAttendance) {
      const venueName = myRoundVenues.get(a.roundId);
      if (!venueName) continue;
      const set = sharedVenuesByPartner.get(a.userId) ?? new Set<string>();
      set.add(venueName);
      sharedVenuesByPartner.set(a.userId, set);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">People</h1>
        <p className="text-sm text-foreground/60">Everyone you&rsquo;ve actually shared a round with.</p>
      </div>

      {edges.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground/60">
          You haven&rsquo;t met anyone yet — attend or host a round to start building this list.
        </p>
      ) : (
        <ul className="space-y-2">
          {edges.map((edge) => {
            const partnerId = edge.userAId === user.id ? edge.userBId : edge.userAId;
            const partner = partnerById.get(partnerId);
            if (!partner) return null;
            const venues = Array.from(sharedVenuesByPartner.get(partnerId) ?? []);
            return (
              <li
                key={edge.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/10 text-sm font-medium dark:bg-paper/10">
                    {partner.displayName?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div>
                    <p className="font-medium">{partner.displayName}</p>
                    <p className="text-xs text-foreground/60">
                      {edge.roundCount} round{edge.roundCount === 1 ? "" : "s"} together
                      {venues.length > 0 ? ` · ${venues.join(", ")}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-foreground/50">
                  Last met {edge.lastMetAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
