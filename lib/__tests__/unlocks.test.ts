import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { isGroupCreationUnlocked, getGroupCreationProgress } from "@/lib/unlocks";

describe("group creation unlock", () => {
  let groupId: string;
  let venueId: string;
  let hostId: string;
  const attendeeIds: string[] = [];
  const roundIds: string[] = [];
  const createdGroupIds: string[] = [];

  async function makeCompletedRound(attendeeCount: number) {
    const round = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "Unlock test round",
        description: "",
        startsAt: new Date(Date.now() - 60 * 60 * 1000),
        capacity: 8,
        status: "COMPLETED",
      },
    });
    roundIds.push(round.id);
    await prisma.attendance.createMany({
      data: attendeeIds
        .slice(0, attendeeCount)
        .map((userId) => ({ roundId: round.id, userId, confirmedByUserId: hostId })),
    });
    return round;
  }

  beforeAll(async () => {
    const group = await prisma.group.findFirstOrThrow();
    const venue = await prisma.venue.findFirstOrThrow();
    groupId = group.id;
    venueId = venue.id;

    const host = await prisma.user.create({
      data: {
        email: `unlock-test-host-${Date.now()}@example.com`,
        displayName: "Unlock Test Host",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    hostId = host.id;

    for (let i = 0; i < 4; i++) {
      const user = await prisma.user.create({
        data: {
          email: `unlock-test-attendee-${Date.now()}-${i}@example.com`,
          displayName: `Unlock Test Attendee ${i}`,
          dateOfBirth: new Date("1990-01-01"),
          ageAttestedAt: new Date(),
        },
      });
      attendeeIds.push(user.id);
    }
  });

  afterAll(async () => {
    await prisma.group.deleteMany({ where: { id: { in: createdGroupIds } } });
    await prisma.attendance.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.round.deleteMany({ where: { id: { in: roundIds } } });
    await prisma.groupMembership.deleteMany({ where: { userId: { in: [...attendeeIds, hostId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [...attendeeIds, hostId] } } });
  });

  it("denies with only 2 qualifying rounds", async () => {
    await makeCompletedRound(4);
    await makeCompletedRound(4);
    expect(await isGroupCreationUnlocked(hostId)).toBe(false);
  });

  it("a round with only 3 attendees doesn't count toward the threshold", async () => {
    await makeCompletedRound(3);
    const progress = await getGroupCreationProgress(hostId);
    expect(progress.qualifyingRoundsHosted).toBe(2);
    expect(await isGroupCreationUnlocked(hostId)).toBe(false);
  });

  it("allows once a 3rd qualifying round (4+ attendees) is confirmed", async () => {
    await makeCompletedRound(4);
    const progress = await getGroupCreationProgress(hostId);
    expect(progress.qualifyingRoundsHosted).toBe(3);
    expect(await isGroupCreationUnlocked(hostId)).toBe(true);
  });

  it("denies a user at the 2-group cap regardless of host record", async () => {
    const g1 = await prisma.group.create({
      data: {
        slug: `unlock-test-g1-${Date.now()}`,
        name: "Unlock Test Group 1",
        description: "d",
        city: "Washington",
        kind: "SOCIAL",
        createdByUserId: hostId,
      },
    });
    const g2 = await prisma.group.create({
      data: {
        slug: `unlock-test-g2-${Date.now()}`,
        name: "Unlock Test Group 2",
        description: "d",
        city: "Washington",
        kind: "SOCIAL",
        createdByUserId: hostId,
      },
    });
    createdGroupIds.push(g1.id, g2.id);

    expect(await isGroupCreationUnlocked(hostId)).toBe(false);
  });
});
