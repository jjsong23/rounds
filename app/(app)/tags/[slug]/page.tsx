import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatInZone } from "@/lib/datetime";
import { toggleTagFollow } from "../actions";

export default async function TagDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag || !tag.isActive) notFound();

  const [rounds, isFollowing] = await Promise.all([
    prisma.round.findMany({
      where: {
        roundTags: { some: { tagId: tag.id } },
        startsAt: { gte: new Date() },
        status: { in: ["OPEN", "FULL"] },
        group: { status: "ACTIVE" },
      },
      include: { venue: true, group: true, host: true, rsvps: { where: { status: "GOING" } } },
      orderBy: { startsAt: "asc" },
    }),
    user
      ? prisma.tagFollow.findUnique({ where: { userId_tagId: { userId: user.id, tagId: tag.id } } })
      : null,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tag.label}</h1>
          <p className="text-sm text-foreground/60">
            Upcoming rounds tagged {tag.label.toLowerCase()}, across every active group.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await toggleTagFollow(tag.id, tag.slug);
          }}
        >
          <button
            type="submit"
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              isFollowing ? "border border-border" : "bg-ink text-paper dark:bg-paper dark:text-ink"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </form>
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground/60">
          No upcoming rounds with this tag yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {rounds.map((round) => {
            const spotsLeft = Math.max(0, round.capacity - round.rsvps.length);
            return (
              <li key={round.id}>
                <Link
                  href={`/rounds/${round.id}`}
                  className="block rounded-xl border border-border p-4 hover:border-ink/30 dark:hover:border-paper/30"
                >
                  <p className="font-semibold">{round.title}</p>
                  <p className="text-sm text-foreground/60">
                    {formatInZone(round.startsAt)} · {round.group.name}
                    {round.venue
                      ? ` · ${round.venue.name}`
                      : round.locationText
                        ? ` · ${round.locationText}`
                        : ""}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">
                    {round.status === "FULL" ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
