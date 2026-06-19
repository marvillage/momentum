import Link from "next/link";
import { prisma } from "@/lib/db";
import { NewActivity } from "@/components/NewActivity";

export const dynamic = "force-dynamic";

export default async function Activities() {
  const acts = await prisma.activity.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">Your system</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">Manage</h1>
        <p className="text-muted mt-2 text-sm">Tap any activity to set its cadence, target, and upload its queue.</p>
      </div>

      <NewActivity />

      <div className="rounded-2xl border border-line divide-y divide-line overflow-hidden bg-surface">
        {acts.map((a) => (
          <Link
            key={a.id}
            href={`/activities/${a.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface2 transition-colors"
          >
            <div className="min-w-0">
              <div className="font-bold truncate">{a.name}</div>
              <div className="text-muted text-[11px] uppercase tracking-wide font-semibold mt-0.5">
                {a.area} · {a.cadence} · target {a.targetCount}
                {a.minCount ? ` (min ${a.minCount})` : ""}
                {a._count.items > 0 ? ` · ${a._count.items} queued` : ""}
              </div>
            </div>
            <span
              className={`shrink-0 text-[11px] font-black uppercase px-2 py-1 rounded ${
                a.active ? "bg-lime/15 text-lime" : "bg-surface2 text-muted"
              }`}
            >
              {a.active ? "on" : "off"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
