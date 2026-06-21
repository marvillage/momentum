import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ActivityEditor } from "@/components/ActivityEditor";
import { requireUser } from "@/lib/auth";
import { todayStr, addDays } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const since = addDays(todayStr(), -29);
  const [a, groups] = await Promise.all([
    prisma.activity.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: "asc" } },
        metrics: { orderBy: { sortOrder: "asc" }, include: { entries: { where: { date: { gte: since } }, orderBy: { date: "asc" } } } },
      },
    }),
    prisma.group.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!a || a.userId !== user.id) notFound();

  // Per-metric insights over the last 30 days.
  const insights = a.metrics.map((m) => {
    const vals = m.entries.map((e) => e.value);
    const last7 = m.entries.filter((e) => e.date >= addDays(todayStr(), -6));
    const sum = vals.reduce((s, v) => s + v, 0);
    return {
      label: m.label,
      unit: m.unit,
      kind: m.kind,
      days: m.entries.length,
      total: sum,
      avg: vals.length ? +(sum / vals.length).toFixed(1) : 0,
      week: last7.reduce((s, e) => s + e.value, 0),
      latest: vals.length ? vals[vals.length - 1] : null,
    };
  });
  const hasData = insights.some((i) => i.days > 0);

  return (
    <div className="space-y-6">
      <Link href="/activities" className="text-muted text-sm font-bold uppercase tracking-wide hover:text-ink">
        ← Manage
      </Link>
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">{a.area}</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">{a.icon ? `${a.icon} ` : ""}{a.name}</h1>
      </div>

      {hasData && (
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">Insights · last 30 days</h2>
          <div className="grid grid-cols-2 gap-3">
            {insights.filter((i) => i.days > 0).map((i) => (
              <div key={i.label} className="rounded-2xl border border-line bg-surface p-4">
                <div className="text-muted text-[10px] font-bold uppercase tracking-widest">{i.label}{i.unit ? ` (${i.unit})` : ""}</div>
                <div className="text-2xl font-black text-lime mt-1">
                  {i.kind === "RATING" ? `${i.avg} avg` : i.kind === "COUNT" ? `${i.total} total` : `${i.avg} avg`}
                </div>
                <div className="text-muted text-[11px] mt-1">
                  {i.days} day{i.days === 1 ? "" : "s"} · this week {Math.round(i.week)}{i.unit ? ` ${i.unit}` : ""} · last {i.latest ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ActivityEditor
        groups={groups.map((g) => ({ id: g.id, name: g.name, icon: g.icon }))}
        activity={{
          id: a.id,
          name: a.name,
          area: a.area,
          type: a.type,
          icon: a.icon,
          link: a.link,
          groupId: a.groupId,
          cadence: a.cadence,
          daysOfWeek: a.daysOfWeek,
          biweeklyDays: a.biweeklyDays,
          everyNDays: a.everyNDays,
          durationMin: a.durationMin,
          targetCount: a.targetCount,
          minCount: a.minCount,
          unit: a.unit,
          active: a.active,
          rollover: a.rollover,
          items: a.items.map((i) => ({ id: i.id, title: i.title, url: i.url, done: i.done, order: i.order })),
          metrics: a.metrics.map((m) => ({ id: m.id, label: m.label, unit: m.unit, kind: m.kind })),
        }}
      />
    </div>
  );
}
