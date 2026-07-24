import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getGroupCreationProgress } from "@/lib/unlocks";

const KIND_LABELS: Record<string, string> = {
  HOSTED_ROUND: "Hosted a round that filled",
  ROUND_FILLED: "Round filled before start",
  REPEAT_ATTENDEE: "Brought back repeat attendees",
};

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [xpEvents, progress] = await Promise.all([
    prisma.xpEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    getGroupCreationProgress(user.id),
  ]);

  const total = xpEvents.reduce((sum, e) => sum + e.points, 0);
  const breakdown = new Map<string, number>();
  for (const e of xpEvents) {
    breakdown.set(e.kind, (breakdown.get(e.kind) ?? 0) + e.points);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{user.displayName}</h1>
        <p className="text-sm text-foreground/60">{user.city}</p>
        {user.bio && <p className="mt-2 text-sm text-foreground/80">{user.bio}</p>}
      </div>

      <div className="rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Your points</p>
        <p className="mt-1 text-3xl font-semibold">{total}</p>
        <p className="text-xs text-foreground/60">Private — only you can see this.</p>

        {breakdown.size > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {Array.from(breakdown.entries()).map(([kind, points]) => (
              <li key={kind} className="flex justify-between">
                <span className="text-foreground/70">{KIND_LABELS[kind] ?? kind}</span>
                <span className="font-medium">{points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border p-5">
        <p className="text-sm font-semibold">Creating your own group</p>
        {progress.groupsCreated >= progress.groupCap ? (
          <p className="mt-1 text-sm text-foreground/60">
            You&rsquo;ve created {progress.groupsCreated} of {progress.groupCap} groups — that&rsquo;s the
            cap.
          </p>
        ) : progress.unlocked ? (
          <p className="mt-1 text-sm text-moss">
            Unlocked —{" "}
            <Link href="/groups/new" className="underline underline-offset-4">
              create a group
            </Link>
            .
          </p>
        ) : (
          <p className="mt-1 text-sm text-foreground/60">
            {progress.qualifyingRoundsHosted} of {progress.requiredRounds} qualifying rounds hosted (4+
            confirmed attendees each).
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {xpEvents.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">
            Nothing yet — host a round that fills up to get started.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {xpEvents.slice(0, 20).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <span>{KIND_LABELS[e.kind] ?? e.kind}</span>
                <span className="font-medium">+{e.points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
