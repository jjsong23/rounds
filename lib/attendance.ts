import type { Prisma } from "@/generated/prisma/client";
import { buildEdgesForNewAttendees, removeEdgesForDroppedAttendees } from "@/lib/edges";
import { ensureUpcomingOccurrences } from "@/lib/series";
import { awardAttendanceXp } from "@/lib/xp";

export const ATTENDANCE_EDIT_WINDOW_DAYS = 7;

export function isAttendanceEditable(round: { startsAt: Date }, at: Date = new Date()): boolean {
  const deadline = round.startsAt.getTime() + ATTENDANCE_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return at.getTime() <= deadline;
}

// Diff-based resync: whether this is the first submission or an edit
// within the 7-day window, only the attendees who actually changed get
// their Attendance row and warm-graph edges touched. Unchanged attendees
// are left alone, so re-submitting the same set twice is a no-op.
export async function syncAttendance(
  tx: Prisma.TransactionClient,
  roundId: string,
  targetUserIds: string[],
  confirmedByUserId: string,
  at: Date,
) {
  const current = await tx.attendance.findMany({ where: { roundId } });
  const currentIds = current.map((a) => a.userId);
  const currentIdSet = new Set(currentIds);
  const targetIdSet = new Set(targetUserIds);

  const toRemove = current.filter((a) => !targetIdSet.has(a.userId));
  const toAdd = targetUserIds.filter((id) => !currentIdSet.has(id));

  if (toRemove.length > 0) {
    await removeEdgesForDroppedAttendees(tx, currentIds, new Set(toRemove.map((a) => a.userId)));
    await tx.attendance.deleteMany({ where: { id: { in: toRemove.map((a) => a.id) } } });
  }

  if (toAdd.length > 0) {
    await tx.attendance.createMany({
      data: toAdd.map((userId) => ({ roundId, userId, confirmedAt: at, confirmedByUserId })),
    });
    await buildEdgesForNewAttendees(tx, targetUserIds, new Set(toAdd), at);
  }

  const round = await tx.round.update({ where: { id: roundId }, data: { status: "COMPLETED" } });

  await awardAttendanceXp(tx, { id: round.id, hostId: round.hostId }, targetUserIds);

  if (round.seriesId) {
    await ensureUpcomingOccurrences(tx, round.seriesId);
  }
}
