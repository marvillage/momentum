import { prisma } from "./db";
import { todayStr, dowOf, weekStartStr } from "./date";

/**
 * Make sure today's task instances exist for every active activity.
 * Idempotent — safe to call on every page load and from cron.
 */
export async function ensureToday(): Promise<void> {
  const today = todayStr();
  const dow = dowOf(today);
  const weekStart = weekStartStr(today);

  const activities = await prisma.activity.findMany({
    where: { active: true },
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
      data: { activityId: a.id, date: dateFor, itemId },
    });
  }
}

export async function getDashboard() {
  const today = todayStr();
  const weekStart = weekStartStr(today);

  const todays = await prisma.taskInstance.findMany({
    where: {
      OR: [{ date: today }, { date: weekStart, activity: { cadence: "WEEKLY" } }],
    },
    include: { activity: true, item: true },
    orderBy: [{ activity: { sortOrder: "asc" } }],
  });

  const backlog = await prisma.taskInstance.findMany({
    where: {
      status: "PENDING",
      date: { lt: today },
      activity: { cadence: { not: "WEEKLY" } },
    },
    include: { activity: true, item: true },
    orderBy: [{ date: "asc" }],
  });

  return { today, weekStart, todays, backlog };
}
