import { prisma } from "./db";
import { todayStr, addDays } from "./date";

// Valorant-style tiers, keyed by last-30-day completion %.
export const TIERS = [
  { min: 100, label: "Radiant", emoji: "🔆", color: "#5eead4" },
  { min: 96, label: "Immortal", emoji: "👑", color: "#ff4d6d" },
  { min: 91, label: "Ascendant", emoji: "🌿", color: "#3ddc97" },
  { min: 83, label: "Diamond", emoji: "💎", color: "#8ab4ff" },
  { min: 73, label: "Platinum", emoji: "🛡️", color: "#3fd0c9" },
  { min: 60, label: "Gold", emoji: "🥇", color: "#ffd23f" },
  { min: 45, label: "Silver", emoji: "🥈", color: "#c8cdd6" },
  { min: 30, label: "Bronze", emoji: "🥉", color: "#cd7f32" },
  { min: 0, label: "Iron", emoji: "⛏️", color: "#9a9a92" },
] as const;

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
  let sched = 0;
  let done = 0;
  for (const t of tasks) {
    const c = byDay.get(t.date) || { t: 0, d: 0 };
    c.t++;
    if (t.status === "DONE") c.d++;
    byDay.set(t.date, c);
    if (t.date >= from30) {
      sched++;
      if (t.status === "DONE") done++;
    }
  }

  const pct = sched > 0 ? Math.round((100 * done) / sched) : 0;
  const calibrating = sched < 10; // placement matches before a rank sticks
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
