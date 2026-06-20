import { prisma } from "./db";
import { todayStr, dowOf, weekStartStr, daysBetween } from "./date";

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

  // For content activities (problems/video), surface the next N un-done queue
  // items so the day shows exactly what to do, each tappable & checkable.
  const todays = await Promise.all(
    todaysRaw.map(async (t) => {
      const wantsBatch = (t.activity.type === "PROBLEMS" || t.activity.type === "VIDEO") && t.status !== "DONE";
      if (!wantsBatch) return { ...t, batch: [] as { id: string; title: string; url: string | null }[] };
      const items = await prisma.item.findMany({
        where: { activityId: t.activityId, done: false },
        orderBy: { order: "asc" },
        take: Math.max(1, t.activity.targetCount),
        select: { id: true, title: true, url: true },
      });
      return { ...t, batch: items };
    })
  );

  const backlogRaw = await prisma.taskInstance.findMany({
    where: {
      userId,
      status: "PENDING",
      date: { lt: today },
      activity: { cadence: { not: "WEEKLY" }, ...actFilter },
    },
    include: { activity: true, item: true },
    orderBy: [{ date: "asc" }],
  });
  const backlog = backlogRaw.map((t) => ({ ...t, batch: [] as { id: string; title: string; url: string | null }[] }));

  return { today, weekStart, todays, backlog };
}
