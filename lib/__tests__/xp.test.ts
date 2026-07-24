import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { syncAttendance } from "@/lib/attendance";
import { performRsvp } from "@/lib/rsvp";

describe("XP awarding", () => {
  let groupId: string;
  let venueId: string;
  let hostId: string;
  const attendeeIds: string[] = [];
  const roundIds: string[] = [];

  beforeAll(async () => {
    const group = await prisma.group.findFirstOrThrow();
    const venue = await prisma.venue.findFirstOrThrow();
    groupId = group.id;
    venueId = venue.id;

    const host = await prisma.user.create({
      data: {
        email: `xp-test-host-${Date.now()}@example.com`,
        displayName: "XP Test Host",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    hostId = host.id;

    for (let i = 0; i < 4; i++) {
      const user = await prisma.user.create({
        data: {
          email: `xp-test-attendee-${Date.now()}-${i}@example.com`,
          displayName: `XP Test Attendee ${i}`,
          dateOfBirth: new Date("1990-01-01"),
          ageAttestedAt: new Date(),
        },
      });
      attendeeIds.push(user.id);
    }
  });

  afterAll(async () => {
    const allIds = [...attendeeIds, hostId];
    await prisma.xpEvent.deleteMany({ where: { userId: hostId } });
    await prisma.attendance.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.rsvp.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.edge.deleteMany({
      where: { OR: [{ userAId: { in: allIds } }, { userBId: { in: allIds } }] },
    });
    await prisma.round.deleteMany({ where: { id: { in: roundIds } } });
    await prisma.groupMembership.deleteMany({ where: { userId: { in: allIds } } });
    await prisma.user.deleteMany({ where: { id: { in: allIds } } });
  });

  it("awards HOSTED_ROUND once a round is confirmed with 3+ attendees", async () => {
    const roundA = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "XP test round A",
        description: "",
        startsAt: new Date(Date.now() - 60 * 60 * 1000),
        capacity: 6,
      },
    });
    roundIds.push(roundA.id);

    const [u1, u2, u3] = attendeeIds;
    await prisma.$transaction((tx) => syncAttendance(tx, roundA.id, [u1, u2, u3], hostId, new Date()));

    const event = await prisma.xpEvent.findUniqueOrThrow({
      where: { userId_kind_roundId: { userId: hostId, kind: "HOSTED_ROUND", roundId: roundA.id } },
    });
    expect(event.points).toBe(50);

    // No repeat-attendee award yet — this is everyone's first round with this host.
    const repeatEvent = await prisma.xpEvent.findUnique({
      where: { userId_kind_roundId: { userId: hostId, kind: "REPEAT_ATTENDEE", roundId: roundA.id } },
    });
    expect(repeatEvent).toBeNull();
  });

  it("awards REPEAT_ATTENDEE, aggregated per round, when the same people come back", async () => {
    const roundB = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "XP test round B",
        description: "",
        startsAt: new Date(Date.now() - 30 * 60 * 1000),
        capacity: 6,
      },
    });
    roundIds.push(roundB.id);

    const [u1, u2, u3] = attendeeIds;
    await prisma.$transaction((tx) => syncAttendance(tx, roundB.id, [u1, u2, u3], hostId, new Date()));

    const hostedEvent = await prisma.xpEvent.findUniqueOrThrow({
      where: { userId_kind_roundId: { userId: hostId, kind: "HOSTED_ROUND", roundId: roundB.id } },
    });
    expect(hostedEvent.points).toBe(50);

    const repeatEvent = await prisma.xpEvent.findUniqueOrThrow({
      where: { userId_kind_roundId: { userId: hostId, kind: "REPEAT_ATTENDEE", roundId: roundB.id } },
    });
    expect(repeatEvent.points).toBe(45); // 3 repeat attendees x 15
  });

  it("is idempotent: re-running the same attendance submission doesn't double-award", async () => {
    const roundB = await prisma.round.findFirstOrThrow({ where: { title: "XP test round B" } });
    const [u1, u2, u3] = attendeeIds;

    await prisma.$transaction((tx) => syncAttendance(tx, roundB.id, [u1, u2, u3], hostId, new Date()));

    const events = await prisma.xpEvent.findMany({ where: { userId: hostId, roundId: roundB.id } });
    expect(events).toHaveLength(2); // HOSTED_ROUND + REPEAT_ATTENDEE, still exactly one of each
    const repeatEvent = events.find((e) => e.kind === "REPEAT_ATTENDEE");
    expect(repeatEvent?.points).toBe(45);
  });

  it("awards ROUND_FILLED exactly once when a round hits capacity before it starts", async () => {
    const roundC = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "XP test round C",
        description: "",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        capacity: 2,
      },
    });
    roundIds.push(roundC.id);

    const [u1, u2, u3] = attendeeIds;
    await performRsvp(prisma, roundC.id, u1);
    await performRsvp(prisma, roundC.id, u2); // fills capacity -> should award once
    await performRsvp(prisma, roundC.id, u3); // waitlisted, round stays FULL -> no re-award

    const events = await prisma.xpEvent.findMany({
      where: { userId: hostId, kind: "ROUND_FILLED", roundId: roundC.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].points).toBe(25);
  });
});
