import { prisma } from "@/lib/prisma";
import { canonicalizePair } from "@/lib/edges";

export async function hasWarmEdge(userId: string, otherUserId: string): Promise<boolean> {
  if (userId === otherUserId) return true;
  const [userAId, userBId] = canonicalizePair(userId, otherUserId);
  const edge = await prisma.edge.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
  return Boolean(edge);
}

export async function getWarmGraphUserIds(userId: string): Promise<string[]> {
  const edges = await prisma.edge.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
  return edges.map((e) => (e.userAId === userId ? e.userBId : e.userAId));
}

// The authorization check lives here, in the data-access function itself —
// not in a UI conditional — so a direct hit on /last-call/[id] can never
// leak a post to someone outside the poster's warm graph, regardless of
// what the nav does or doesn't link to.
export async function getVisibleLastCall(id: string, viewerId: string) {
  const lastCall = await prisma.lastCall.findUnique({
    where: { id },
    include: { user: true, venue: true, responses: { include: { user: true } } },
  });
  if (!lastCall) return null;
  if (lastCall.expiresAt.getTime() < Date.now()) return null;
  if (lastCall.userId === viewerId) return lastCall;

  const visible = await hasWarmEdge(viewerId, lastCall.userId);
  return visible ? lastCall : null;
}
