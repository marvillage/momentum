import { prisma } from "./db";
import { todayStr, dowOf, weekStartStr, daysBetween } from "./date";

// Whether `dateStr` falls in an "on" biweekly week (even week index from a
// fixed reference Monday, 2024-01-01). Used for every-other-week publishing.
function isBiweeklyWeek(dateStr: string): boolean {
  const idx = Math.floor(daysBetween(weekStartStr("2024-01-01"), weekStartStr(dateStr)) / 7);
  return idx % 2 === 0;
}

/**
 * Make sure today's task instances exist for every active activity.
 * Idempotent — safe to call on every page load and from cron.
 */
export async function ensureToday(userId: string): Promise<void> {
  const today = todayStr();
  const dow = dowOf(today);
  const weekStart = weekStartStr(today);

  const activities = await prisma.activity.findMany({
    where: { active: true, userId },
    include: { items: { orderBy: { order: "asc" } } },
  });

  for (const a of activities) {
    let dateFor: string | null = null;
    if (a.cadence === "DAILY") dateFor = today;
    else if (a.cadence === "WEEKDAYS") dateFor = dow <= 5 ? today : null;
    else if (a.cadence === "WEEKLY") dateFor = weekStart;
    else if (a.cadence === "DAYS" && a.daysOfWeek) {
      const set = a.daysOfWeek.split(",").map((s) => parseInt(s.trim(), 10));
      dateFor = set.includes(dow) ? today : null;
    } else if (a.cadence === "EVERY_N" && a.everyNDays && a.everyNDays > 0) {
      const anchor = a.createdAt.toISOString().slice(0, 10);
      const diff = daysBetween(anchor, today);
      dateFor = diff >= 0 && diff % a.everyNDays === 0 ? today : null;
    }

    // Biweekly publishing days fire every other week, on top of any cadence.
    if (!dateFor && a.biweeklyDays) {
      const set = a.biweeklyDays.split(",").map((s) => parseInt(s.trim(), 10));
      if (set.includes(dow) && isBiweeklyWeek(today)) dateFor = today;
    }

    if (!dateFor) continue;

    const existing = await prisma.taskInstance.findFirst({
      where: { activityId: a.id, date: dateFor },
    });
    if (existing) continue;

    // Attach the next un-used catalog item, if this activity has a queue.
    let itemId: string | null = null;
    if (a.items.length) {
      const used = await prisma.taskInstance.findMany({
        where: { activityId: a.id, NOT: { itemId: null } },
        select: { itemId: true },
      });
      const usedSet = new Set(used.map((u) => u.itemId));
      const next = a.items.find((it) => !it.done && !usedSet.has(it.id));
      itemId = next?.id ?? null;
    }

    await prisma.taskInstance.create({
      data: { activityId: a.id, date: dateFor, itemId, userId },
    });
  }
}

export async function getDashboard(userId: string, opts: { groupId?: string } = {}) {
  const today = todayStr();
  const weekStart = weekStartStr(today);
  const actFilter = opts.groupId ? { groupId: opts.groupId } : {};

  const todaysRaw = await prisma.taskInstance.findMany({
    where: {
      userId,
      AND: [
        { OR: [{ date: today }, { date: weekStart, activity: { cadence: "WEEKLY" } }] },
        { activity: actFilter },
      ],
    },
    include: { activity: true, item: true },
    orderBy: [{ activity: { sortOrder: "asc" } }],
  });

  // Enrich each task: content activities get their next N queue items; gym
  // tasks get that weekday's saved exercises, shown inline on Today.
  type Gym = { name: string; sets: number; reps: number; weight: number };
  const emptyBatch: { id: string; title: string; url: string | null }[] = [];
  const dow = dowOf(today);
  const todays = await Promise.all(
    todaysRaw.map(async (t) => {
      let gym: Gym[] = [];
      if (t.activity.type === "GYM") {
        gym = await prisma.gymExercise.findMany({
          where: { userId, dow },
          orderBy: { order: "asc" },
          select: { name: true, sets: true, reps: true, weight: true },
        });
      }
      const wantsBatch = (t.activity.type === "PROBLEMS" || t.activity.type === "VIDEO") && t.status !== "DONE";
      const batch = wantsBatch
        ? await prisma.item.findMany({
            where: { activityId: t.activityId, done: false },
            orderBy: { order: "asc" },
            take: Math.max(1, t.activity.targetCount),
            select: { id: true, title: true, url: true },
          })
        : emptyBatch;
      return { ...t, batch, gym };
    })
  );

  const backlogRaw = await prisma.taskInstance.findMany({
    where: {
      userId,
      status: "PENDING",
      date: { lt: today },
      activity: { cadence: { not: "WEEKLY" }, rollover: true, ...actFilter },
    },
    include: { activity: true, item: true },
    orderBy: [{ date: "asc" }],
  });
  const backlog = backlogRaw.map((t) => ({
    ...t,
    batch: [] as { id: string; title: string; url: string | null }[],
    gym: [] as { name: string; sets: number; reps: number; weight: number }[],
  }));

  return { today, weekStart, todays, backlog };
}
