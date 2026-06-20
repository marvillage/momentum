import { prisma } from "./db";
import { todayStr, addDays } from "./date";

// Simple metal tiers, keyed by the credited 30-day score.
export const TIERS = [
  { min: 80, label: "Gold", emoji: "🥇", color: "#ffd23f" },
  { min: 50, label: "Silver", emoji: "🥈", color: "#c8cdd6" },
  { min: 0, label: "Iron", emoji: "⛏️", color: "#9a9a92" },
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
  // scheduled are skipped (rest days don't break the chain). One missed day is
  // forgiven by a built-in "freeze" so a single off-day won't reset you.
  let streak = 0;
  let grace = 1;
  let cursor = (byDay.get(today)?.d ?? 0) >= 1 ? today : addDays(today, -1);
  for (let i = 0; i < 120; i++) {
    const c = byDay.get(cursor);
    if (!c || c.t === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (c.d >= 1) {
      streak++;
      cursor = addDays(cursor, -1);
    } else if (grace > 0) {
      grace--; // freeze this missed day and keep going
      cursor = addDays(cursor, -1);
    } else break;
  }
  const freezeLeft = grace;

  const totalDone = await prisma.taskInstance.count({ where: { userId, status: "DONE" } });
  const xp = totalDone * 10;
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const xpThisLevel = 50 * (level - 1) * (level - 1);
  const xpNextLevel = 50 * level * level;

  // Weekly recap (last 7 days).
  const weekFrom = addDays(today, -6);
  let weekDone = 0;
  let cleanSweeps = 0;
  let activeDays = 0;
  for (const [date, c] of byDay) {
    if (date < weekFrom || date > today || c.t === 0) continue;
    weekDone += c.d;
    if (c.d >= 1) activeDays++;
    if (c.d === c.t) cleanSweeps++;
  }

  // Achievements (earned from current standing).
  const badges = [
    { key: "first", label: "First Win", emoji: "✅", earned: totalDone >= 1 },
    { key: "ten", label: "10 Done", emoji: "🔟", earned: totalDone >= 10 },
    { key: "fifty", label: "50 Done", emoji: "🏅", earned: totalDone >= 50 },
    { key: "century", label: "Century", emoji: "💯", earned: totalDone >= 100 },
    { key: "streak7", label: "7-Day Streak", emoji: "🔥", earned: streak >= 7 },
    { key: "streak30", label: "30-Day Streak", emoji: "🌟", earned: streak >= 30 },
    { key: "silver", label: "Silver Rank", emoji: "🥈", earned: !calibrating && pct >= 50 },
    { key: "gold", label: "Gold Rank", emoji: "🥇", earned: !calibrating && pct >= 80 },
  ];

  // Rank-up detection: compare to the last rank we recorded for this user.
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { lastRank: true } });
  const idx = TIERS.findIndex((t) => t.label === tier.label);
  const prevIdx = u?.lastRank ? TIERS.findIndex((t) => t.label === u.lastRank) : -1;
  const rankedUp = !calibrating && prevIdx >= 0 && idx < prevIdx; // lower index = higher tier
  if (!calibrating && u && u.lastRank !== tier.label) {
    await prisma.user.update({ where: { id: userId }, data: { lastRank: tier.label } });
  }

  return {
    pct,
    calibrating,
    tier,
    nextTier: up,
    streak,
    freezeLeft,
    xp,
    level,
    levelProgress: Math.round((100 * (xp - xpThisLevel)) / Math.max(1, xpNextLevel - xpThisLevel)),
    totalDone,
    sched30: sched,
    done30: done,
    weekly: { done: weekDone, cleanSweeps, activeDays },
    badges,
    rankedUp,
    rankLabel: tier.label,
  };
}
