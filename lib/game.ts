import { prisma } from "./db";
import { todayStr, addDays } from "./date";

// Cosmic 7-stage tiers, keyed by the credited 30-day score.
export const TIERS = [
  { min: 96, label: "Supernova", emoji: "🌌", color: "#5eead4" },
  { min: 88, label: "Quasar", emoji: "💫", color: "#c084fc" },
  { min: 78, label: "Pulsar", emoji: "🌠", color: "#8ab4ff" },
  { min: 66, label: "Nova", emoji: "🌟", color: "#3ddc97" },
  { min: 52, label: "Comet", emoji: "☄️", color: "#ffd23f" },
  { min: 35, label: "Star", emoji: "⭐", color: "#ffb454" },
  { min: 0, label: "Spark", emoji: "✨", color: "#9a9a92" },
] as const;

// A day's completion % is mapped generously: hit ~70% of the day and it counts
// as a full day; 50% still banks 80%. Below that it scales down.
export function dayCredit(rawPct: number): number {
  if (rawPct >= 70) return 100;
  if (rawPct >= 50) return 80 + ((rawPct - 50) / 20) * 20;
  return rawPct * 1.6; // 0..50% -> 0..80
}

export type Tier = (typeof TIERS)[number];

export function tierFor(pct: number): Tier {
  return TIERS.find((t) => pct >= t.min)!;
}

/** The next tier up + how many % points to reach it (null at Radiant). */
export function nextTier(pct: number): { tier: Tier; toGo: number } | null {
  const idx = TIERS.findIndex((t) => pct >= t.min);
  if (idx <= 0) return null; // already Radiant
  const up = TIERS[idx - 1];
  return { tier: up, toGo: Math.max(1, up.min - pct) };
}

export async function getGameState(userId: string) {
  const today = todayStr();
  const from30 = addDays(today, -29);

  const tasks = await prisma.taskInstance.findMany({
    where: { userId, date: { gte: addDays(today, -89) } },
    select: { date: true, status: true },
  });

  const byDay = new Map<string, { t: number; d: number }>();
  for (const t of tasks) {
    const c = byDay.get(t.date) || { t: 0, d: 0 };
    c.t++;
    if (t.status === "DONE") c.d++;
    byDay.set(t.date, c);
  }

  // Rank score = average of each day's *credited* completion over the last 30
  // days (days with nothing scheduled are skipped). The credit curve makes
  // ~70%-days count as full and 50%-days bank 80%.
  let creditSum = 0;
  let dayCount = 0;
  let sched = 0;
  let done = 0;
  for (const [date, c] of byDay) {
    if (date < from30 || c.t === 0) continue;
    creditSum += dayCredit(Math.round((100 * c.d) / c.t));
    dayCount++;
    sched += c.t;
    done += c.d;
  }

  const pct = dayCount > 0 ? Math.round(creditSum / dayCount) : 0;
  const calibrating = dayCount < 5; // placement days before a rank sticks
  const tier = tierFor(pct);
  const up = nextTier(pct);

  // Overall streak: consecutive days you completed ≥1 task. Days with nothing
  // scheduled are skipped (a rest day doesn't break the chain).
  let streak = 0;
  let cursor = (byDay.get(today)?.d ?? 0) >= 1 ? today : addDays(today, -1);
  for (let i = 0; i < 90; i++) {
    const c = byDay.get(cursor);
    if (!c || c.t === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (c.d >= 1) {
      streak++;
      cursor = addDays(cursor, -1);
    } else break;
  }

  const totalDone = await prisma.taskInstance.count({ where: { userId, status: "DONE" } });
  const xp = totalDone * 10;
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const xpThisLevel = 50 * (level - 1) * (level - 1);
  const xpNextLevel = 50 * level * level;

  return {
    pct,
    calibrating,
    tier,
    nextTier: up,
    streak,
    xp,
    level,
    levelProgress: Math.round((100 * (xp - xpThisLevel)) / Math.max(1, xpNextLevel - xpThisLevel)),
    totalDone,
    sched30: sched,
    done30: done,
  };
}
