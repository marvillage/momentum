import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ActivityEditor } from "@/components/ActivityEditor";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [a, groups] = await Promise.all([
    prisma.activity.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } }),
    prisma.group.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!a || a.userId !== user.id) notFound();

  return (
    <div className="space-y-6">
      <Link href="/activities" className="text-muted text-sm font-bold uppercase tracking-wide hover:text-ink">
        ← Manage
      </Link>
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">{a.area}</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">{a.name}</h1>
      </div>
      <ActivityEditor
        groups={groups.map((g) => ({ id: g.id, name: g.name, icon: g.icon }))}
        activity={{
          id: a.id,
          name: a.name,
          area: a.area,
          type: a.type,
          icon: a.icon,
          groupId: a.groupId,
          cadence: a.cadence,
          daysOfWeek: a.daysOfWeek,
          everyNDays: a.everyNDays,
          durationMin: a.durationMin,
          targetCount: a.targetCount,
          minCount: a.minCount,
          unit: a.unit,
          active: a.active,
          rollover: a.rollover,
          items: a.items.map((i) => ({ id: i.id, title: i.title, url: i.url, done: i.done, order: i.order })),
        }}
      />
    </div>
  );
}
