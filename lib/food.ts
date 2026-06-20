import { prisma } from "./db";
import { todayStr, addDays } from "./date";

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
  const since = addDays(date, -6);
  const [logs, settings, water, saved, weekLogs, weekWater] = await Promise.all([
    prisma.foodLog.findMany({ where: { userId, date }, orderBy: { createdAt: "asc" } }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.waterLog.findMany({ where: { userId, date } }),
    prisma.savedMeal.findMany({ where: { userId }, orderBy: [{ uses: "desc" }, { createdAt: "desc" }], take: 12 }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: since, lte: date } }, select: { date: true, kcal: true, protein: true } }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: since, lte: date } }, select: { date: true, ml: true } }),
  ]);

  const kcal = logs.reduce((s, l) => s + l.kcal, 0);
  const protein = logs.reduce((s, l) => s + l.protein, 0);
  const carbs = logs.reduce((s, l) => s + l.carbs, 0);
  const waterMl = water.reduce((s, w) => s + w.ml, 0);

  // 7-day history (oldest → today).
  const byDay = new Map<string, { kcal: number; protein: number; water: number }>();
  for (const l of weekLogs) {
    const c = byDay.get(l.date) || { kcal: 0, protein: 0, water: 0 };
    c.kcal += l.kcal; c.protein += l.protein; byDay.set(l.date, c);
  }
  for (const w of weekWater) {
    const c = byDay.get(w.date) || { kcal: 0, protein: 0, water: 0 };
    c.water += w.ml; byDay.set(w.date, c);
  }
  const history: { date: string; kcal: number; protein: number; water: number }[] = [];
  for (let d = since; d <= date; d = addDays(d, 1)) {
    const c = byDay.get(d) || { kcal: 0, protein: 0, water: 0 };
    history.push({ date: d, ...c });
  }

  return {
    date,
    logs,
    kcal,
    protein,
    carbs,
    waterMl,
    saved,
    history,
    kcalTarget: settings?.kcalTarget ?? 2200,
    proteinTarget: settings?.proteinTarget ?? 140,
    carbsTarget: settings?.carbsTarget ?? 250,
    waterTargetMl: settings?.waterTargetMl ?? 3000,
    loggedBuckets: new Set(logs.map((l) => l.bucket)),
    current: currentBucket(),
  };
}
