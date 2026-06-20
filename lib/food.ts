import { prisma } from "./db";
import { todayStr } from "./date";

const TZ = process.env.APP_TZ || "Asia/Kolkata";

// Meal buckets and the local-time window each one "owns" (DINNER wraps past
// midnight, so its window runs to 28 = 4am next day).
export const BUCKETS = [
  { key: "BREAKFAST", label: "Breakfast", from: 4, to: 11 },
  { key: "LUNCH", label: "Lunch", from: 11, to: 15 },
  { key: "SNACK", label: "Snack", from: 15, to: 18 },
  { key: "DINNER", label: "Dinner", from: 18, to: 28 },
] as const;

export type Bucket = (typeof BUCKETS)[number]["key"];

/** The meal bucket the current local time falls into. */
export function currentBucket(tz: string = TZ): Bucket {
  const h = parseInt(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()),
    10
  );
  const hh = h < 4 ? h + 24 : h;
  const b = BUCKETS.find((x) => hh >= x.from && hh < x.to);
  return (b ?? BUCKETS[BUCKETS.length - 1]).key;
}

export async function getFoodDay(userId: string, date: string = todayStr()) {
  const [logs, settings] = await Promise.all([
    prisma.foodLog.findMany({ where: { userId, date }, orderBy: { createdAt: "asc" } }),
    prisma.settings.findUnique({ where: { userId } }),
  ]);
  const kcal = logs.reduce((s, l) => s + l.kcal, 0);
  const protein = logs.reduce((s, l) => s + l.protein, 0);
  return {
    date,
    logs,
    kcal,
    protein,
    kcalTarget: settings?.kcalTarget ?? 2200,
    proteinTarget: settings?.proteinTarget ?? 140,
    loggedBuckets: new Set(logs.map((l) => l.bucket)),
    current: currentBucket(),
  };
}
