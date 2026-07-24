import { describe, expect, it } from "vitest";
import { zonedTimeToUtc, nextSeriesOccurrence, formatInZone } from "@/lib/datetime";

describe("zonedTimeToUtc", () => {
  it("converts a wall-clock time to the correct UTC instant on either side of a DST transition", () => {
    // 2026-03-08 is when America/New_York springs forward (EST -> EDT).
    const beforeDst = zonedTimeToUtc("2026-03-03T18:00"); // still EST (UTC-5)
    const afterDst = zonedTimeToUtc("2026-03-10T18:00"); // now EDT (UTC-4)

    expect(beforeDst.toISOString()).toBe("2026-03-03T23:00:00.000Z");
    expect(afterDst.toISOString()).toBe("2026-03-10T22:00:00.000Z");
  });
});

describe("nextSeriesOccurrence", () => {
  it("holds the local wall-clock time fixed across a spring-forward transition", () => {
    const firstOccurrence = zonedTimeToUtc("2026-03-03T18:00"); // Tue 6pm EST
    const secondOccurrence = nextSeriesOccurrence(firstOccurrence, "WEEKLY");

    // A naive "+7*24h in UTC" would land on 23:00Z (7pm local) — wrong.
    // The correct next Tuesday 6pm, now in EDT, is 22:00Z.
    expect(secondOccurrence.toISOString()).toBe("2026-03-10T22:00:00.000Z");
    expect(formatInZone(secondOccurrence, { hour: "2-digit", minute: "2-digit", hour12: true })).toBe(
      "06:00 PM",
    );
  });

  it("holds the local wall-clock time fixed across a fall-back transition", () => {
    // 2026-11-01 is when America/New_York falls back (EDT -> EST).
    const firstOccurrence = zonedTimeToUtc("2026-10-27T18:00"); // Tue 6pm EDT
    const secondOccurrence = nextSeriesOccurrence(firstOccurrence, "WEEKLY");

    expect(secondOccurrence.toISOString()).toBe("2026-11-03T23:00:00.000Z");
    expect(formatInZone(secondOccurrence, { hour: "2-digit", minute: "2-digit", hour12: true })).toBe(
      "06:00 PM",
    );
  });

  it("advances by 14 days for BIWEEKLY and 28 days for MONTHLY", () => {
    const first = zonedTimeToUtc("2026-06-02T19:30"); // Tue
    const biweekly = nextSeriesOccurrence(first, "BIWEEKLY");
    const monthly = nextSeriesOccurrence(first, "MONTHLY");

    expect(
      formatInZone(biweekly, { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
    ).toBe("Tue 07:30 PM");
    expect(
      formatInZone(monthly, { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
    ).toBe("Tue 07:30 PM");
  });
});
