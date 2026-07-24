import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getUserForSession } from "@/lib/user-session";

describe("session age re-verification", () => {
  let adultUserId: string;
  let underageUserId: string;

  beforeAll(async () => {
    const adult = await prisma.user.create({
      data: {
        email: `session-test-adult-${Date.now()}@example.com`,
        displayName: "Adult Test User",
        dateOfBirth: new Date(new Date().getFullYear() - 30, 0, 1),
        ageAttestedAt: new Date(),
      },
    });
    adultUserId = adult.id;

    // Simulates a User row whose age no longer clears 21 — e.g. a stale or
    // corrupted record — regardless of how the session cookie got here.
    const underage = await prisma.user.create({
      data: {
        email: `session-test-underage-${Date.now()}@example.com`,
        displayName: "Underage Test User",
        dateOfBirth: new Date(new Date().getFullYear() - 16, 0, 1),
        ageAttestedAt: new Date(),
      },
    });
    underageUserId = underage.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [adultUserId, underageUserId] } } });
  });

  it("returns the user when the stored date of birth clears 21", async () => {
    const user = await getUserForSession(adultUserId);
    expect(user).not.toBeNull();
    expect(user?.id).toBe(adultUserId);
  });

  it("rejects a session belonging to an under-21 record, every time it's checked", async () => {
    const first = await getUserForSession(underageUserId);
    const second = await getUserForSession(underageUserId);
    expect(first).toBeNull();
    expect(second).toBeNull();
  });
});
