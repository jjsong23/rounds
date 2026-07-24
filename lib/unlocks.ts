import { prisma } from "@/lib/prisma";

export const GROUP_CREATION_REQUIRED_ROUNDS = 3;
export const GROUP_CREATION_MIN_ATTENDEES = 4;
export const GROUP_CREATION_CAP = 2;

export type GroupCreationProgress = {
  qualifyingRoundsHosted: number;
  requiredRounds: number;
  groupsCreated: number;
  groupCap: number;
  unlocked: boolean;
};

// A round "qualifies" once it's COMPLETED with 4+ confirmed attendees.
// Always recomputed fresh from Attendance/Round rows — never cached or
// trusted from a client — since this gates a real permission.
export async function getGroupCreationProgress(userId: string): Promise<GroupCreationProgress> {
  const hostedCompletedRounds = await prisma.round.findMany({
    where: { hostId: userId, status: "COMPLETED" },
    include: { _count: { select: { attendances: true } } },
  });
  const qualifyingRoundsHosted = hostedCompletedRounds.filter(
    (r) => r._count.attendances >= GROUP_CREATION_MIN_ATTENDEES,
  ).length;

  const groupsCreated = await prisma.group.count({ where: { createdByUserId: userId } });

  const unlocked =
    qualifyingRoundsHosted >= GROUP_CREATION_REQUIRED_ROUNDS && groupsCreated < GROUP_CREATION_CAP;

  return {
    qualifyingRoundsHosted,
    requiredRounds: GROUP_CREATION_REQUIRED_ROUNDS,
    groupsCreated,
    groupCap: GROUP_CREATION_CAP,
    unlocked,
  };
}

// Server-side re-check inside the create action itself — never trust that
// the client only reached /groups/new because the UI happened to allow it.
export async function isGroupCreationUnlocked(userId: string): Promise<boolean> {
  const progress = await getGroupCreationProgress(userId);
  return progress.unlocked;
}
