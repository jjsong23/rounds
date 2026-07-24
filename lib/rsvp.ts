import type { Prisma, PrismaClient, RsvpStatus } from "@/generated/prisma/client";
import { awardRoundFilledXp } from "@/lib/xp";

// Locks the Round row so concurrent RSVP transactions against the same
// round serialize on the count-then-insert below, rather than racing past
// each other and overselling capacity.
async function lockRoundForUpdate(tx: Prisma.TransactionClient, roundId: string) {
  await tx.$queryRawUnsafe(`SELECT id FROM "Round" WHERE id = $1 FOR UPDATE`, roundId);
}

async function countGoing(tx: Prisma.TransactionClient, roundId: string): Promise<number> {
  return tx.rsvp.count({ where: { roundId, status: "GOING" } });
}

// Sets FULL/OPEN based on current GOING count vs capacity. Never touches
// CANCELLED or COMPLETED rounds.
export async function recomputeRoundStatus(tx: Prisma.TransactionClient, roundId: string) {
  const round = await tx.round.findUniqueOrThrow({ where: { id: roundId } });
  if (round.status !== "OPEN" && round.status !== "FULL") return;

  const goingCount = await countGoing(tx, roundId);
  const nextStatus = goingCount >= round.capacity ? "FULL" : "OPEN";
  if (nextStatus !== round.status) {
    await tx.round.update({ where: { id: roundId }, data: { status: nextStatus } });

    if (nextStatus === "FULL" && round.startsAt.getTime() > Date.now()) {
      await awardRoundFilledXp(tx, roundId, round.hostId);
    }
  }
}

export type RsvpOutcome = { status: RsvpStatus; error?: never } | { status?: never; error: string };

// The whole "RSVP to a round" operation: capacity check + insert in one
// transaction, guarded by lockRoundForUpdate so two simultaneous RSVPs
// can't both squeeze into the last seat. Also joins the caller to the
// round's group in the same transaction if they aren't already a member —
// RSVPing from a tag/venue page shouldn't require joining first.
// Pulled out of the server action so it can be unit/load-tested directly,
// without needing a Next.js request context for auth().
export async function performRsvp(
  client: PrismaClient,
  roundId: string,
  userId: string,
): Promise<RsvpOutcome> {
  const round = await client.round.findUnique({ where: { id: roundId } });
  if (!round) return { error: "Round not found." };
  if (round.status === "CANCELLED") return { error: "This round was cancelled." };
  if (round.status === "COMPLETED") return { error: "This round has already happened." };

  const existing = await client.rsvp.findUnique({ where: { roundId_userId: { roundId, userId } } });
  if (existing && existing.status !== "CANCELLED") {
    return { error: `You're already ${existing.status === "GOING" ? "going" : "on the waitlist"}.` };
  }

  const status = await client.$transaction(async (tx) => {
    await lockRoundForUpdate(tx, roundId);

    await tx.groupMembership.upsert({
      where: { userId_groupId: { userId, groupId: round.groupId } },
      create: { userId, groupId: round.groupId },
      update: {},
    });

    const goingCount = await countGoing(tx, roundId);
    const nextStatus: RsvpStatus = goingCount < round.capacity ? "GOING" : "WAITLIST";

    if (existing) {
      await tx.rsvp.update({
        where: { id: existing.id },
        data: { status: nextStatus, createdAt: new Date() },
      });
    } else {
      await tx.rsvp.create({ data: { roundId, userId, status: nextStatus } });
    }

    await recomputeRoundStatus(tx, roundId);

    return nextStatus;
  });

  return { status };
}

export type CancelOutcome = { ok: true; error?: never } | { ok?: never; error: string };

// Cancels the caller's RSVP and, if they were GOING, promotes the
// longest-waiting WAITLIST entry into the vacated seat.
export async function performCancelRsvp(
  client: PrismaClient,
  roundId: string,
  userId: string,
): Promise<CancelOutcome> {
  const round = await client.round.findUnique({ where: { id: roundId } });
  if (!round) return { error: "Round not found." };
  if (round.hostId === userId) {
    return { error: "You're hosting this round — cancel the round itself instead of just your RSVP." };
  }

  const existing = await client.rsvp.findUnique({ where: { roundId_userId: { roundId, userId } } });
  if (!existing || existing.status === "CANCELLED") {
    return { error: "You don't have an active RSVP for this round." };
  }

  await client.$transaction(async (tx) => {
    await lockRoundForUpdate(tx, roundId);

    await tx.rsvp.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });

    if (existing.status === "GOING") {
      const nextWaitlisted = await tx.rsvp.findFirst({
        where: { roundId, status: "WAITLIST" },
        orderBy: { createdAt: "asc" },
      });
      if (nextWaitlisted) {
        await tx.rsvp.update({ where: { id: nextWaitlisted.id }, data: { status: "GOING" } });
      }
    }

    await recomputeRoundStatus(tx, roundId);
  });

  return { ok: true };
}
