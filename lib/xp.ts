import type { Prisma } from "@/generated/prisma/client";

// Hosting-weighted by design: nothing here is earned by merely attending,
// and nothing is tied to drinks consumed — there is no such counter in this
// product. Each kind is awarded at most once per (user, round) via the
// XpEvent unique constraint, so re-running attendance confirmation can
// never double-award; once a threshold is crossed and awarded, later edits
// that fall back below it don't claw the points back.
export const XP_POINTS = {
  HOSTED_ROUND: 50,
  ROUND_FILLED: 25,
  REPEAT_ATTENDEE_PER_PERSON: 15,
} as const;

const HOSTED_ROUND_MIN_ATTENDEES = 3;

async function awardOnce(
  tx: Prisma.TransactionClient,
  userId: string,
  kind: "HOSTED_ROUND" | "ROUND_FILLED" | "REPEAT_ATTENDEE",
  roundId: string,
  points: number,
) {
  await tx.xpEvent.upsert({
    where: { userId_kind_roundId: { userId, kind, roundId } },
    create: { userId, kind, roundId, points },
    update: {},
  });
}

// Called when a hosted round's GOING count first reaches capacity, strictly
// before the round starts.
export async function awardRoundFilledXp(tx: Prisma.TransactionClient, roundId: string, hostId: string) {
  await awardOnce(tx, hostId, "ROUND_FILLED", roundId, XP_POINTS.ROUND_FILLED);
}

// Called from attendance confirmation with the final set of confirmed
// attendee ids for the round.
export async function awardAttendanceXp(
  tx: Prisma.TransactionClient,
  round: { id: string; hostId: string },
  confirmedAttendeeIds: string[],
) {
  if (confirmedAttendeeIds.length >= HOSTED_ROUND_MIN_ATTENDEES) {
    await awardOnce(tx, round.hostId, "HOSTED_ROUND", round.id, XP_POINTS.HOSTED_ROUND);
  }

  let repeatCount = 0;
  for (const attendeeId of confirmedAttendeeIds) {
    if (attendeeId === round.hostId) continue;
    const priorAttendance = await tx.attendance.findFirst({
      where: { userId: attendeeId, round: { hostId: round.hostId, id: { not: round.id } } },
    });
    if (priorAttendance) repeatCount++;
  }

  if (repeatCount > 0) {
    await awardOnce(
      tx,
      round.hostId,
      "REPEAT_ATTENDEE",
      round.id,
      XP_POINTS.REPEAT_ATTENDEE_PER_PERSON * repeatCount,
    );
  }
}
