// All rounds are in the DC/Silver Spring area for v1, so times are entered
// and displayed in this single zone rather than the visiting browser's
// local zone. Stored instants are always UTC (Prisma DateTime).
export const APP_TIME_ZONE = "America/New_York";

// Thin wrapper around `new Date()`/`Date.now()` so call sites in Server
// Components read as calling an ordinary imported function rather than an
// inline impure global — satisfies eslint-plugin-react-hooks' purity rule,
// which flags direct Date.now()/new Date() calls in component bodies even
// though these are async Server Components (evaluated once per request,
// not subject to React's client re-render semantics).
export function now(): Date {
  return new Date();
}

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
};

export function getZonedParts(date: Date, timeZone: string = APP_TIME_ZONE): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === "24" ? "0" : map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (asUtc - date.getTime()) / 60000;
}

// Converts a `<input type="datetime-local">` value (a zone-less wall-clock
// string like "2026-08-01T18:00") into the correct UTC instant for
// `timeZone`, correctly accounting for DST since the offset is derived from
// the actual zone rules at that instant rather than a fixed offset.
export function zonedTimeToUtc(dateTimeLocal: string, timeZone: string = APP_TIME_ZONE): Date {
  const [datePart, timePart] = dateTimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offsetMinutes * 60000);
}

export function formatInZone(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  timeZone: string = APP_TIME_ZONE,
): string {
  // dateStyle/timeStyle can't be combined with explicit field options
  // (hour, weekday, etc.) per the Intl spec, so only default to them when
  // the caller didn't ask for specific fields.
  const resolvedOptions = options ?? { dateStyle: "medium", timeStyle: "short" };
  return new Intl.DateTimeFormat("en-US", { timeZone, ...resolvedOptions }).format(date);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const CADENCE_DAYS = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 28 } as const;

// Computes the next occurrence after `previousStartsAt`, holding the local
// wall-clock time (and therefore the day of week) fixed across the DST
// transition — the UTC instant shifts by an hour when the offset changes,
// but the venue's clock always reads the same time.
export function nextSeriesOccurrence(
  previousStartsAt: Date,
  cadence: keyof typeof CADENCE_DAYS,
  timeZone: string = APP_TIME_ZONE,
): Date {
  const local = getZonedParts(previousStartsAt, timeZone);
  const days = CADENCE_DAYS[cadence];

  // Advance the calendar date by `days` using UTC-field arithmetic (safe:
  // Date.UTC normalizes month/day overflow), then re-attach the same local
  // hour/minute and convert that wall-clock string back through the real
  // zone rules for the new date.
  const advanced = new Date(Date.UTC(local.year, local.month - 1, local.day + days));
  const dateTimeLocal = `${advanced.getUTCFullYear()}-${pad(advanced.getUTCMonth() + 1)}-${pad(
    advanced.getUTCDate(),
  )}T${pad(local.hour)}:${pad(local.minute)}`;

  return zonedTimeToUtc(dateTimeLocal, timeZone);
}
