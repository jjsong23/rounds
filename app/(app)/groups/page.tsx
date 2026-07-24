import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const KIND_LABELS: Record<string, string> = {
  INDUSTRY: "Industry",
  SOCIAL: "Social",
  ACTIVITY: "Activity",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const { q, city: cityParam } = await searchParams;
  const user = await getCurrentUser();
  const city = cityParam ?? user?.city ?? undefined;
  const now = new Date();

  const groups = await prisma.group.findMany({
    where: {
      status: "ACTIVE",
      ...(city ? { city } : {}),
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          }
        : {}),
    },
    include: {
      memberships: { select: { userId: true } },
      rounds: {
        orderBy: { startsAt: "desc" },
        take: 8,
        include: { roundTags: { include: { tag: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const suggestedVenues = await prisma.venue.findMany({
    where: city ? { city } : undefined,
    take: 3,
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Groups</h1>
          <p className="text-sm text-foreground/60">
            Any signed-in user can join any active group. Rounds get posted inside groups — any member can
            host.
          </p>
        </div>
        <Link
          href="/groups/new"
          className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-ink/50 dark:hover:border-paper/50"
        >
          Create a group
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search groups…"
          className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="city"
          defaultValue={city ?? ""}
          placeholder="City"
          className="w-40 rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          Search
        </button>
      </form>

      {groups.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-foreground/60">No groups match yet. Be the first to host a round.</p>
          {suggestedVenues.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedVenues.map((v) => (
                <Link
                  key={v.id}
                  href={`/venues/${v.slug}`}
                  className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-ink/50 dark:hover:border-paper/50"
                >
                  {v.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const isMember = user ? group.memberships.some((m) => m.userId === user.id) : false;
            const nextRound = group.rounds
              .filter((r) => r.startsAt >= now && (r.status === "OPEN" || r.status === "FULL"))
              .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
            const tagLabels = Array.from(
              new Set(group.rounds.flatMap((r) => r.roundTags.map((rt) => rt.tag.label))),
            ).slice(0, 3);

            return (
              <Link
                key={group.id}
                href={`/groups/${group.slug}`}
                className="block rounded-xl border border-border p-4 transition hover:border-ink/30 dark:hover:border-paper/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{group.name}</h2>
                    <p className="text-sm text-foreground/60">
                      {KIND_LABELS[group.kind]} · {group.city} · {group.memberships.length} member
                      {group.memberships.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {isMember && (
                    <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-paper dark:bg-paper dark:text-ink">
                      Joined
                    </span>
                  )}
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{group.description}</p>

                {tagLabels.length > 0 && (
                  <p className="mt-2 text-xs text-foreground/60">{tagLabels.join(" · ")}</p>
                )}

                {nextRound ? (
                  <p className="mt-3 text-xs font-medium text-foreground/80">
                    Next: {nextRound.title} ·{" "}
                    {nextRound.startsAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-foreground/50">No upcoming round yet</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
