import Link from "next/link";
import { prisma } from "@/lib/db";
import { NewActivity } from "@/components/NewActivity";
import { GroupManager } from "@/components/GroupManager";
import { TRACK_SUMMARY } from "@/lib/tracks";
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

      <NewActivity groups={groupOpts} tracks={TRACK_SUMMARY} />
      <GroupManager groups={groupRows} />

      <div className="space-y-6">
        {buckets.filter((b) => b.items.length > 0).map((b) => (
          <div key={b.key}>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-2">{b.label} · {b.items.length}</h3>
            <div className="rounded-2xl border border-line divide-y divide-line overflow-hidden bg-surface">
              {b.items.map((a) => (
                <Link key={a.id} href={`/activities/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface2 transition-colors">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{a.icon ? `${a.icon} ` : ""}{a.name}</div>
                    <div className="text-muted text-[11px] uppercase tracking-wide font-semibold mt-0.5">
                      {a.type} · {a.cadence}{a.everyNDays ? ` ${a.everyNDays}d` : ""} · target {a.targetCount}
                      {a.minCount ? ` (min ${a.minCount})` : ""}
                      {a.durationMin ? ` · ${a.durationMin}m` : ""}
                      {a._count.items > 0 ? ` · ${a._count.items} queued` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-black uppercase px-2 py-1 rounded ${a.active ? "bg-lime/15 text-lime" : "bg-surface2 text-muted"}`}>
                    {a.active ? "on" : "off"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
