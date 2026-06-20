import { prisma } from "./db";
import { todayStr, addDays } from "./date";

export type ActivityStat = {
  id: string;
  name: string;
  area: string;
  active: boolean;
  streak: number;
  longest: number;
  doneCount: number;
  rate30: number;
};

export type HeatCell = { date: string; total: number; done: number; ratio: number };

export async function getStats(userId: string) {
  const today = todayStr();
  const tasks = await prisma.taskInstance.findMany({ where: { userId }, include: { activity: true } });

  // group dates+status per activity
  const byAct = new Map<string, { activity: (typeof tasks)[number]["activity"]; dates: Map<string, string> }>();
  for (const t of tasks) {
    let g = byAct.get(t.activityId);
    if (!g) {
      g = { activity: t.activity, dates: new Map() };
      byAct.set(t.activityId, g);
    }
    g.dates.set(t.date, t.status);
  }

  const perActivity: ActivityStat[] = [...byAct.values()]
    .map((g) => {
      const d = g.dates;
      let doneCount = 0;
      d.forEach((s) => s === "DONE" && doneCount++);

      // current streak — count consecutive scheduled days that are DONE, walking back
      let streak = 0;
      let cursor = d.get(today) === "DONE" ? today : addDays(today, -1);
      for (let i = 0; i < 400; i++) {
        const s = d.get(cursor);
        if (s === undefined) {
          cursor = addDays(cursor, -1);
          continue;
        }
        if (s === "DONE") {
          streak++;
          cursor = addDays(cursor, -1);
        } else break;
      }

      // longest run of consecutive scheduled occurrences done
      const dates = [...d.keys()].sort();
      let longest = 0,
        run = 0;
      for (const dd of dates) {
        if (d.get(dd) === "DONE") {
          run++;
          if (run > longest) longest = run;
        } else run = 0;
      }

      // last-30-day completion rate (scheduled days only)
      const from = addDays(today, -29);
      let tot = 0,
        done = 0;
      dates.forEach((dd) => {
        if (dd >= from && dd <= today) {
          tot++;
          if (d.get(dd) === "DONE") done++;
        }
      });

      return {
        id: g.activity.id,
        name: g.activity.name,
        area: g.activity.area,
        active: g.activity.active,
        streak,
        longest,
        doneCount,
        rate30: tot ? Math.round((100 * done) / tot) : 0,
      };
    })
    .sort((a, b) => b.streak - a.streak || b.doneCount - a.doneCount);

  // overall heatmap, last 84 days
  const dateCounts = new Map<string, { t: number; d: number }>();
  for (const t of tasks) {
    const c = dateCounts.get(t.date) || { t: 0, d: 0 };
    c.t++;
    if (t.status === "DONE") c.d++;
    dateCounts.set(t.date, c);
  }
  const heatmap: HeatCell[] = [];
  let cur = addDays(today, -83);
  while (cur <= today) {
    const c = dateCounts.get(cur);
    heatmap.push({ date: cur, total: c?.t || 0, done: c?.d || 0, ratio: c && c.t ? c.d / c.t : 0 });
    cur = addDays(cur, 1);
  }

  const totalsDone = perActivity.reduce((s, a) => s + a.doneCount, 0);
  return { totals: { done: totalsDone, activities: perActivity.length }, perActivity, heatmap };
}
