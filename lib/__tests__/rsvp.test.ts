import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { performRsvp, performCancelRsvp } from "@/lib/rsvp";

describe("RSVP concurrency and waitlist", () => {
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
        email: `rsvp-test-host-${Date.now()}@example.com`,
        displayName: "RSVP Test Host",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    hostId = host.id;

    for (let i = 0; i < 10; i++) {
      const user = await prisma.user.create({
        data: {
          email: `rsvp-test-user-${Date.now()}-${i}@example.com`,
          displayName: `RSVP Test User ${i}`,
          dateOfBirth: new Date("1990-01-01"),
          ageAttestedAt: new Date(),
        },
      });
      userIds.push(user.id);
    }
  });

  afterAll(async () => {
    await prisma.xpEvent.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.rsvp.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.round.deleteMany({ where: { id: { in: roundIds } } });
    await prisma.groupMembership.deleteMany({ where: { userId: { in: [...userIds, hostId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [...userIds, hostId] } } });
  });

  it("never lets concurrent RSVPs exceed capacity", async () => {
    const round = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "Concurrency test round",
        description: "",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        capacity: 6,
      },
    });
    roundIds.push(round.id);

    const outcomes = await Promise.all(userIds.map((userId) => performRsvp(prisma, round.id, userId)));

    const goingCount = outcomes.filter((o) => o.status === "GOING").length;
    const waitlistCount = outcomes.filter((o) => o.status === "WAITLIST").length;
    const errors = outcomes.filter((o) => o.error);

    expect(errors).toHaveLength(0);
    expect(goingCount).toBe(6);
    expect(waitlistCount).toBe(4);

    const dbGoingCount = await prisma.rsvp.count({ where: { roundId: round.id, status: "GOING" } });
    expect(dbGoingCount).toBe(6);

    const refreshed = await prisma.round.findUniqueOrThrow({ where: { id: round.id } });
    expect(refreshed.status).toBe("FULL");
  });

  it("promotes the longest-waiting waitlist entry when a GOING RSVP cancels", async () => {
    const round = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "Waitlist promotion test round",
        description: "",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        capacity: 2,
      },
    });
    roundIds.push(round.id);

    const [first, second, third] = userIds;
    await performRsvp(prisma, round.id, first);
    await performRsvp(prisma, round.id, second);
    const thirdOutcome = await performRsvp(prisma, round.id, third);
    expect(thirdOutcome.status).toBe("WAITLIST");

    await performCancelRsvp(prisma, round.id, first);

    const thirdRsvp = await prisma.rsvp.findUniqueOrThrow({
      where: { roundId_userId: { roundId: round.id, userId: third } },
    });
    expect(thirdRsvp.status).toBe("GOING");

    const refreshed = await prisma.round.findUniqueOrThrow({ where: { id: round.id } });
    expect(refreshed.status).toBe("FULL");
  });

  it("won't let the host cancel their own RSVP without cancelling the round", async () => {
    const round = await prisma.round.create({
      data: {
        groupId,
        hostId,
        venueId,
        title: "Host cancel guard test round",
        description: "",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        capacity: 4,
      },
    });
    roundIds.push(round.id);

    await performRsvp(prisma, round.id, hostId);
    const outcome = await performCancelRsvp(prisma, round.id, hostId);
    expect(outcome.error).toBeTruthy();
  });
});
