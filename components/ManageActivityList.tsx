"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

type A = {
  id: string; name: string; icon: string | null; type: string; cadence: string;
  everyNDays: number | null; targetCount: number; minCount: number | null;
  durationMin: number | null; itemCount: number; active: boolean; sortOrder: number;
};

export function ManageActivityList({ items }: { items: A[] }) {
  const router = useRouter();
  const [, start] = useTransition();

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[i], b = items[j];
    start(async () => {
      await Promise.all([
        fetch(`/api/activities/${a.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
        fetch(`/api/activities/${b.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ sortOrder: a.sortOrder }) }),
      ]);
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-line divide-y divide-line overflow-hidden bg-surface">
      {items.map((a, i) => (
        <div key={a.id} className="flex items-center gap-2 px-3 py-3 hover:bg-surface2 transition-colors">
          <div className="flex flex-col shrink-0">
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted hover:text-ink disabled:opacity-25 text-xs leading-none">▲</button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-muted hover:text-ink disabled:opacity-25 text-xs leading-none">▼</button>
          </div>
          <Link href={`/activities/${a.id}`} className="flex items-center justify-between gap-3 flex-1 min-w-0">
            <div className="min-w-0">
              <div className="font-bold truncate">{a.icon ? `${a.icon} ` : ""}{a.name}</div>
              <div className="text-muted text-[11px] uppercase tracking-wide font-semibold mt-0.5">
                {a.type} · {a.cadence}{a.everyNDays ? ` ${a.everyNDays}d` : ""} · target {a.targetCount}
                {a.minCount ? ` (min ${a.minCount})` : ""}
                {a.durationMin ? ` · ${a.durationMin}m` : ""}
                {a.itemCount > 0 ? ` · ${a.itemCount} queued` : ""}
              </div>
            </div>
            <span className={`shrink-0 text-[11px] font-black uppercase px-2 py-1 rounded ${a.active ? "bg-lime/15 text-lime" : "bg-surface2 text-muted"}`}>
              {a.active ? "on" : "off"}
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
