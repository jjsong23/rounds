import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { joinGroup } from "@/app/(app)/groups/actions";
import { LeaveButton } from "./_leave-button";
import { EditDescriptionForm, RemoveMemberButton, AdminCancelRoundButton } from "./_admin-controls";

const KIND_LABELS: Record<string, string> = {
  INDUSTRY: "Industry",
  SOCIAL: "Social",
  ACTIVITY: "Activity",
};

export default async function GroupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      memberships: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      rounds: {
        where: { startsAt: { gte: new Date() }, status: { in: ["OPEN", "FULL"] } },
        orderBy: { startsAt: "asc" },
        include: { venue: true, roundTags: { include: { tag: true } } },
      },
    },
  });

  if (!group || group.status !== "ACTIVE") notFound();

  const myMembership = user ? group.memberships.find((m) => m.userId === user.id) : undefined;
  const isMember = Boolean(myMembership);
  const isAdmin = myMembership?.role === "ADMIN";

  const suggestedVenues = isMember
    ? []
    : await prisma.venue.findMany({ where: { city: group.city }, take: 3, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/groups" className="text-sm text-foreground/60 hover:underline">
          ← Back to groups
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <p className="text-sm text-foreground/60">
              {KIND_LABELS[group.kind]} · {group.city} · {group.memberships.length} member
              {group.memberships.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground/80">{group.description}</p>
        {isAdmin && (
          <div className="mt-2">
            <EditDescriptionForm groupId={group.id} initialDescription={group.description} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isMember ? (
          <>
            <Link
              href={`/rounds/new?groupId=${group.id}`}
              className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
            >
              Host a round
            </Link>
            <LeaveButton groupId={group.id} />
          </>
        ) : (
          <form
            action={async () => {
              "use server";
              await joinGroup(group.id);
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
            >
              Join group
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Upcoming rounds</h2>
        {group.rounds.length === 0 ? (
          <div className="mt-2 space-y-3 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-foreground/60">No rounds scheduled yet. Be the first to host one.</p>
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
          <ul className="mt-3 space-y-2">
            {group.rounds.map((round) => (
              <li key={round.id} className="rounded-lg border border-border">
                <Link
                  href={`/rounds/${round.id}`}
                  className="block p-3 hover:border-ink/30 dark:hover:border-paper/30"
                >
                  <p className="font-medium">{round.title}</p>
                  <p className="text-sm text-foreground/60">
                    {round.startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    {round.venue
                      ? ` · ${round.venue.name}`
                      : round.locationText
                        ? ` · ${round.locationText}`
                        : ""}
                  </p>
                  {round.roundTags.length > 0 && (
                    <p className="mt-1 text-xs text-foreground/60">
                      {round.roundTags.map((rt) => rt.tag.label).join(" · ")}
                    </p>
                  )}
                </Link>
                {isAdmin && (
                  <div className="border-t border-border px-3 py-1.5">
                    <AdminCancelRoundButton groupId={group.id} roundId={round.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {group.memberships.map((m) => (
            <li key={m.id} className="rounded-full border border-border px-3 py-1 text-sm">
              {m.user.displayName}
              {m.role !== "MEMBER" && <span className="ml-1 text-xs text-foreground/60">({m.role})</span>}
              {isAdmin && m.userId !== user?.id && (
                <RemoveMemberButton groupId={group.id} memberUserId={m.userId} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
