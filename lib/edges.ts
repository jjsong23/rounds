import type { Prisma } from "@/generated/prisma/client";

// The warm graph stores each pair once, with userAId < userBId
// lexicographically. Always canonicalize before reading or writing an Edge
// row — never assume the caller already ordered the ids.
export function canonicalizePair(userXId: string, userYId: string): [string, string] {
  return userXId < userYId ? [userXId, userYId] : [userYId, userXId];
}

export async function upsertEdge(tx: Prisma.TransactionClient, userXId: string, userYId: string, at: Date) {
  const [userAId, userBId] = canonicalizePair(userXId, userYId);
  await tx.edge.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, roundCount: 1, firstMetAt: at, lastMetAt: at },
    update: { roundCount: { increment: 1 }, lastMetAt: at },
  });
}

export async function decrementEdge(tx: Prisma.TransactionClient, userXId: string, userYId: string) {
  const [userAId, userBId] = canonicalizePair(userXId, userYId);
  const edge = await tx.edge.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
  if (!edge) return;
  if (edge.roundCount <= 1) {
    await tx.edge.delete({ where: { id: edge.id } });
  } else {
    await tx.edge.update({ where: { id: edge.id }, data: { roundCount: { decrement: 1 } } });
  }
}

// Builds/updates edges for exactly the pairs affected by a set of
// attendees being newly confirmed together at a round. Iterating i<j over
// the full attendee list (rather than pairing each new person against
// everyone individually) guarantees each unordered pair is touched exactly
// once, even when two brand-new attendees are added in the same batch.
export async function buildEdgesForNewAttendees(
  tx: Prisma.TransactionClient,
  fullAttendeeIds: string[],
  newlyAddedIds: Set<string>,
  at: Date,
) {
  for (let i = 0; i < fullAttendeeIds.length; i++) {
    for (let j = i + 1; j < fullAttendeeIds.length; j++) {
      const a = fullAttendeeIds[i];
      const b = fullAttendeeIds[j];
      if (newlyAddedIds.has(a) || newlyAddedIds.has(b)) {
        await upsertEdge(tx, a, b, at);
      }
    }
  }
}

// Mirror of buildEdgesForNewAttendees for attendees being un-marked:
// decrements exactly the pairs touching a removed attendee, computed
// against the attendee list as it was *before* this edit.
export async function removeEdgesForDroppedAttendees(
  tx: Prisma.TransactionClient,
  previousAttendeeIds: string[],
  removedIds: Set<string>,
) {
  for (let i = 0; i < previousAttendeeIds.length; i++) {
    for (let j = i + 1; j < previousAttendeeIds.length; j++) {
      const a = previousAttendeeIds[i];
      const b = previousAttendeeIds[j];
      if (removedIds.has(a) || removedIds.has(b)) {
        await decrementEdge(tx, a, b);
      }
    }
  }
}
