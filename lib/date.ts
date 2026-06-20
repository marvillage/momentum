const TZ = process.env.APP_TZ || "Asia/Kolkata";

/** Today's date as YYYY-MM-DD in the app timezone. */
export function todayStr(tz: string = TZ): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

/** Format a Date as YYYY-MM-DD in the app timezone. */
export function toDateStr(d: Date, tz: string = TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}

/** Current hour (0–23) in the app timezone. */
export function localHour(tz: string = TZ): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()),
    10
  );
}

/** Weekday for a YYYY-MM-DD string: 1 = Mon ... 7 = Sun. */
export function dowOf(dateStr: string): number {
  const js = new Date(dateStr + "T12:00:00Z").getUTCDay(); // 0 = Sun
  return js === 0 ? 7 : js;
}

/** The Monday (YYYY-MM-DD) of the week that contains dateStr. */
export function weekStartStr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - (dowOf(dateStr) - 1));
  return d.toISOString().slice(0, 10);
}

/** Add n days to a YYYY-MM-DD string. */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a -> b (b later = positive). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T12:00:00Z").getTime();
  const db = new Date(b + "T12:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

/** Human label like "Saturday, 20 Jun". */
export function niceDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
