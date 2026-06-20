import { prisma } from "./db";
import { todayStr, addDays } from "./date";

// Per-module dashboards — ~5 parameters each, over the last 7 days.
export async function getModuleStats(userId: string) {
  const today = todayStr();
  const wk = addDays(today, -6);

  const [sets, ratings, weights, foods, waters, settings] = await Promise.all([
    prisma.setLog.findMany({ where: { userId, date: { gte: wk } } }),
    prisma.workoutRating.findMany({ where: { userId, date: { gte: wk } } }),
    prisma.bodyWeight.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 40 }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: wk } } }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: wk } } }),
    prisma.settings.findUnique({ where: { userId } }),
  ]);

  // --- Gym ---
  const gymDays = new Set([...sets.map((s) => s.date), ...ratings.map((r) => r.date)]).size;
  const avgIntensity = ratings.length ? ratings.reduce((a, r) => a + r.intensity, 0) / ratings.length : 0;
  const volume = Math.round(sets.reduce((a, s) => a + s.reps * s.weight, 0));
  const latestWeight = weights[0]?.kg ?? null;
  const weekAgo = weights.find((w) => w.date <= wk)?.kg ?? null;
  const weightChange = latestWeight != null && weekAgo != null ? +(latestWeight - weekAgo).toFixed(1) : null;

  // --- Food (per-day averages over days logged) ---
  const proteinByDay = new Map<string, number>();
  let sumP = 0, sumC = 0, sumK = 0;
  for (const f of foods) {
    sumP += f.protein; sumC += f.carbs; sumK += f.kcal;
    proteinByDay.set(f.date, (proteinByDay.get(f.date) || 0) + f.protein);
  }
  const daysLogged = proteinByDay.size;
  const nD = Math.max(1, daysLogged);
  const waterDays = new Set(waters.map((w) => w.date));
  const sumW = waters.reduce((a, w) => a + w.ml, 0);
  const goal = settings?.proteinTarget ?? 140;
  let proteinHitDays = 0;
  proteinByDay.forEach((v) => v >= goal && proteinHitDays++);

  return {
    hasGym: sets.length > 0 || ratings.length > 0 || weights.length > 0,
    hasFood: foods.length > 0 || waters.length > 0,
    gym: {
      days: gymDays,
      avgIntensity: +avgIntensity.toFixed(1),
      sets: sets.length,
      volume,
      latestWeight,
      weightChange,
    },
    food: {
      avgProtein: Math.round(sumP / nD),
      avgCarbs: Math.round(sumC / nD),
      avgKcal: Math.round(sumK / nD),
      avgWaterL: +(sumW / Math.max(1, waterDays.size) / 1000).toFixed(1),
      proteinHitDays,
      daysLogged,
    },
  };
}
