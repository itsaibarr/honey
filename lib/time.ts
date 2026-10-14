/**
 * Timezone helpers with no external dependencies.
 *
 * Deliveries land at a civil "morning" time in the recipient's timezone, so we
 * need to convert "2026-07-01 08:00 in the recipient's tz" into a precise UTC
 * instant. Fixed-offset zones (e.g. a UTC+5 zone with no DST) are exact; DST
 * zones are correct except for the rare hour straddling a transition.
 */

/** Offset (ms) of `timeZone` from UTC at the given instant: wallclock - utc. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(date).map((x) => [x.type, x.value]),
  );
  const asUTC = Date.UTC(
    +p.year,
    +p.month - 1,
    +p.day,
    +p.hour,
    +p.minute,
    +p.second,
  );
  return asUTC - date.getTime();
}

/** The UTC instant whose wallclock time in `timeZone` is the given civil time. */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

/** "2026-07-01" + 8 + "Europe/Paris" -> the UTC Date for 08:00 that morning. */
export function localTimeUtc(
  isoDate: string,
  hour: number,
  timeZone: string,
): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return zonedToUtc(y, m, d, hour, 0, timeZone);
}

/** Civil calendar parts of an instant as seen in a timezone. */
export function civilParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(date).map((x) => [x.type, x.value]),
  );
  return {
    year: +p.year,
    monthName: p.month as string,
    day: +p.day,
    weekday: p.weekday as string,
    hour: +p.hour % 24,
  };
}

/** "YYYY-MM-DD" calendar date of an instant as seen in a timezone. */
export function civilDateLocal(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Whole-calendar-day difference (b - a) in a timezone. 0 = same day. */
export function civilDayDiff(a: Date, b: Date, timeZone: string): number {
  const dayKey = (d: Date) => {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const p = Object.fromEntries(
      dtf.formatToParts(d).map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day);
  };
  return Math.round((dayKey(b) - dayKey(a)) / 86_400_000);
}
