import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getVisibleLastCall } from "@/lib/last-call";
import { canonicalizePair } from "@/lib/edges";

describe("Last Call visibility", () => {
  let posterId: string;
  let connectedUserId: string;
  let strangerId: string;
  let lastCallId: string;

  beforeAll(async () => {
    const poster = await prisma.user.create({
      data: {
        email: `lastcall-test-poster-${Date.now()}@example.com`,
        displayName: "Poster",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    const connected = await prisma.user.create({
      data: {
        email: `lastcall-test-connected-${Date.now()}@example.com`,
        displayName: "Connected",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    const stranger = await prisma.user.create({
      data: {
        email: `lastcall-test-stranger-${Date.now()}@example.com`,
        displayName: "Stranger",
        dateOfBirth: new Date("1990-01-01"),
        ageAttestedAt: new Date(),
      },
    });
    posterId = poster.id;
    connectedUserId = connected.id;
    strangerId = stranger.id;

    const [userAId, userBId] = canonicalizePair(posterId, connectedUserId);
    await prisma.edge.create({
      data: { userAId, userBId, roundCount: 1, firstMetAt: new Date(), lastMetAt: new Date() },
    });

    const lastCall = await prisma.lastCall.create({
      data: {
        userId: posterId,
        locationText: "Test bar",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    lastCallId = lastCall.id;
  });

  afterAll(async () => {
    await prisma.lastCallResponse.deleteMany({ where: { lastCallId } });
    await prisma.lastCall.deleteMany({ where: { id: lastCallId } });
    const [userAId, userBId] = canonicalizePair(posterId, connectedUserId);
    await prisma.edge.deleteMany({ where: { userAId, userBId } });
    await prisma.user.deleteMany({ where: { id: { in: [posterId, connectedUserId, strangerId] } } });
  });

  it("is visible to the poster", async () => {
    const result = await getVisibleLastCall(lastCallId, posterId);
    expect(result).not.toBeNull();
  });

  it("is visible to someone sharing a warm-graph edge with the poster", async () => {
    const result = await getVisibleLastCall(lastCallId, connectedUserId);
    expect(result).not.toBeNull();
  });

  it("is NOT visible to a user with no shared edge, even fetching directly by id", async () => {
    const result = await getVisibleLastCall(lastCallId, strangerId);
    expect(result).toBeNull();
  });
});
