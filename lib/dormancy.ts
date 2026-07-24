import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const DORMANCY_THRESHOLD_DAYS = 60;

// Called inline, inside the round-creation transaction — this direction
// (dormant -> active) must never depend on a scheduled job, since failing
// to revive would wrongly hide an active group from browse.
export async function reviveGroup(tx: Prisma.TransactionClient, groupId: string, roundStartsAt: Date) {
  await tx.group.update({
    where: { id: groupId },
    data: { status: "ACTIVE", lastRoundAt: roundStartsAt },
  });
}

// The other direction (active -> dormant) is cosmetic staleness, not a
// correctness issue, so it's safe to run only periodically via a scheduled
// job (see app/api/cron/sweep-dormant-groups).
export async function sweepDormantGroups(): Promise<{ dormantCount: number }> {
  const threshold = new Date(Date.now() - DORMANCY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.group.updateMany({
    where: {
      status: "ACTIVE",
      OR: [{ lastRoundAt: { lt: threshold } }, { lastRoundAt: null, createdAt: { lt: threshold } }],
    },
    data: { status: "DORMANT" },
  });
  return { dormantCount: result.count };
}
