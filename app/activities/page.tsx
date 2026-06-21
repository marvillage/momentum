import { prisma } from "@/lib/db";
import { NewActivity } from "@/components/NewActivity";
import { GroupManager } from "@/components/GroupManager";
import { ManageActivityList } from "@/components/ManageActivityList";
import { AiActivityBuilder } from "@/components/AiActivityBuilder";
import { TRACK_SUMMARY } from "@/lib/tracks";
import { aiEnabled } from "@/lib/llm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Activities() {
  const user = await requireUser();
  const [acts, groups] = await Promise.all([
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } }, group: true },
    }),
    prisma.group.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { activities: true } } },
    }),
  ]);

  const groupOpts = groups.map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
  const groupRows = groups.map((g) => ({
    id: g.id, name: g.name, slug: g.slug, icon: g.icon, kind: g.kind, sortOrder: g.sortOrder, count: g._count.activities,
  }));

  // bucket activities by group (preserving group order, ungrouped last)
  const buckets: { key: string; label: string; items: typeof acts }[] = [];
  for (const g of groups) buckets.push({ key: g.id, label: `${g.icon ? g.icon + " " : ""}${g.name}`, items: [] });
  buckets.push({ key: "none", label: "Ungrouped", items: [] });
  for (const a of acts) {
    const b = buckets.find((x) => x.key === (a.groupId ?? "none"))!;
    b.items.push(a);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">Your system</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">Manage</h1>
        <p className="text-muted mt-2 text-sm">Create any activity, group it into a navbar section, set its frequency, target, and content.</p>
      </div>

      <AiActivityBuilder enabled={aiEnabled()} />
      <NewActivity groups={groupOpts} tracks={TRACK_SUMMARY} />
      <GroupManager groups={groupRows} />

      <div className="space-y-6">
        {buckets.filter((b) => b.items.length > 0).map((b) => (
          <div key={b.key}>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-2">{b.label} · {b.items.length}</h3>
            <ManageActivityList
              items={b.items.map((a) => ({
                id: a.id, name: a.name, icon: a.icon, type: a.type, cadence: a.cadence,
                everyNDays: a.everyNDays, targetCount: a.targetCount, minCount: a.minCount,
                durationMin: a.durationMin, itemCount: a._count.items, active: a.active, rollover: a.rollover, sortOrder: a.sortOrder,
              }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
