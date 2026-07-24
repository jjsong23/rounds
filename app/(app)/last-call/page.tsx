import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getWarmGraphUserIds } from "@/lib/last-call";
import { CancelLastCallButton } from "./_cancel-button";

export default async function LastCallPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const warmGraphIds = await getWarmGraphUserIds(user.id);

  if (warmGraphIds.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed border-border p-8 text-center">
        <h1 className="text-xl font-semibold">Last Call unlocks after your first round</h1>
        <p className="text-sm text-foreground/60">
          Last Call only reaches people you&rsquo;ve actually met — attend or host a round to start
          building that list.
        </p>
        <Link
          href="/feed"
          className="inline-block rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          Go to your feed
        </Link>
      </div>
    );
  }

  const [posts, myActive] = await Promise.all([
    prisma.lastCall.findMany({
      where: { userId: { in: warmGraphIds }, expiresAt: { gt: new Date() } },
      include: { user: true, venue: true, responses: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lastCall.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      include: { venue: true, responses: { include: { user: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Last Call</h1>
          <p className="text-sm text-foreground/60">
            Spontaneous, spur-of-the-moment — visible only to people you&rsquo;ve met.
          </p>
        </div>
        {!myActive && (
          <Link
            href="/last-call/new"
            className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            Post one
          </Link>
        )}
      </div>

      {myActive && (
        <div className="rounded-xl border-2 border-ink p-4 dark:border-paper">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Your active post</p>
          <p className="mt-1 font-medium">{myActive.venue?.name ?? myActive.locationText}</p>
          {myActive.message && <p className="text-sm text-foreground/70">{myActive.message}</p>}
          <p className="mt-1 text-xs text-foreground/60">
            Expires {myActive.expiresAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}{" "}
            · {myActive.responses.length} response{myActive.responses.length === 1 ? "" : "s"}
          </p>
          <div className="mt-2">
            <CancelLastCallButton id={myActive.id} />
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground/60">
          No active Last Call posts from your people right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/last-call/${post.id}`}
                className="block rounded-xl border border-border p-4 hover:border-ink/30 dark:hover:border-paper/30"
              >
                <p className="font-medium">
                  {post.user.displayName} · {post.venue?.name ?? post.locationText}
                </p>
                {post.message && <p className="text-sm text-foreground/70">{post.message}</p>}
                <p className="mt-1 text-xs text-foreground/60">
                  Expires{" "}
                  {post.expiresAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
