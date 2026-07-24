import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { syncAttendance } from "@/lib/attendance";
import { canonicalizePair } from "@/lib/edges";

describe("edge builder", () => {
  let groupId: string;
  let venueId: string;
  let hostId: string;
  const userIds: string[] = [];
  const roundIds: string[] = [];

  beforeAll(async () => {
    const group = await prisma.group.findFirstOrThrow();
    const venue = await prisma.venue.findFirstOrThrow();
    groupId = group.id;
    venueId = venue.id;

    const host = await prisma.user.create({
      data: {
        email: `edge-test-host-${Date.now()}@example.com`,
        displayName: "Edge Test Host",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    hostId = host.id;

    for (let i = 0; i < 4; i++) {
      const user = await prisma.user.create({
        data: {
          email: `edge-test-user-${Date.now()}-${i}@example.com`,
          displayName: `Edge Test User ${i}`,
          dateOfBirth: new Date("1990-01-01"),
          ageAttestedAt: new Date(),
        },
      });
      userIds.push(user.id);
    }
  });

  afterAll(async () => {
    const [uA, uB, uC, uD] = userIds;
    const pairs = [
      [uA, uB],
      [uA, uC],
      [uA, uD],
      [uB, uC],
      [uB, uD],
      [uC, uD],
    ];
    for (const [x, y] of pairs) {
      const [userAId, userBId] = canonicalizePair(x, y);
      await prisma.edge.deleteMany({ where: { userAId, userBId } });
    }
    await prisma.xpEvent.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.attendance.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.round.deleteMany({ where: { id: { in: roundIds } } });
    await prisma.groupMembership.deleteMany({ where: { userId: { in: [...userIds, hostId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [...userIds, hostId] } } });
  });

  it("gives 3 attendees exactly 3 edges", async () => {
    const round = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "Edge test round 1",
        description: "",
        startsAt: new Date(Date.now() - 60 * 60 * 1000),
        capacity: 6,
      },
    });
    roundIds.push(round.id);

    const [u1, u2, u3] = userIds;
    await prisma.$transaction((tx) => syncAttendance(tx, round.id, [u1, u2, u3], hostId, new Date()));

    const [ab, ac, bc] = [canonicalizePair(u1, u2), canonicalizePair(u1, u3), canonicalizePair(u2, u3)];
    for (const [userAId, userBId] of [ab, ac, bc]) {
      const edge = await prisma.edge.findUniqueOrThrow({ where: { userAId_userBId: { userAId, userBId } } });
      expect(edge.roundCount).toBe(1);
    }

    const totalEdges = await prisma.edge.count({
      where: { OR: [ab, ac, bc].map(([userAId, userBId]) => ({ userAId, userBId })) },
    });
    expect(totalEdges).toBe(3);
  });

  it("increments rather than duplicates on a repeat pairing", async () => {
    const round = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "Edge test round 2",
        description: "",
        startsAt: new Date(Date.now() - 30 * 60 * 1000),
        capacity: 6,
      },
    });
    roundIds.push(round.id);

    const [u1, u2, u3] = userIds;
    await prisma.$transaction((tx) => syncAttendance(tx, round.id, [u1, u2, u3], hostId, new Date()));

    const [userAId, userBId] = canonicalizePair(u1, u2);
    const edge = await prisma.edge.findUniqueOrThrow({ where: { userAId_userBId: { userAId, userBId } } });
    expect(edge.roundCount).toBe(2);

    const count = await prisma.edge.count({ where: { userAId, userBId } });
    expect(count).toBe(1);
  });

  it("decrements edges when an attendee is unmarked", async () => {
    const [u1, u2, u3] = userIds;
    const firstRoundId = roundIds[0];

    // Edit round 1's attendance: drop u3, keep u1 and u2.
    await prisma.$transaction((tx) => syncAttendance(tx, firstRoundId, [u1, u2], hostId, new Date()));

    const [a13, b13] = canonicalizePair(u1, u3);
    const edge13 = await prisma.edge.findUnique({
      where: { userAId_userBId: { userAId: a13, userBId: b13 } },
    });
    expect(edge13?.roundCount).toBe(1); // still shared round 2

    const [a12, b12] = canonicalizePair(u1, u2);
    const edge12 = await prisma.edge.findUniqueOrThrow({
      where: { userAId_userBId: { userAId: a12, userBId: b12 } },
    });
    expect(edge12.roundCount).toBe(2); // untouched — both still attended both rounds

    const attendanceStillThere = await prisma.attendance.findUnique({
      where: { roundId_userId: { roundId: firstRoundId, userId: u3 } },
    });
    expect(attendanceStillThere).toBeNull();
  });
});
