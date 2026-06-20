"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Pending = { id: string; title: string; icon: string | null; area: string };

export function EndOfDayReview({ pending, evening }: { pending: Pending[]; evening: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [open, setOpen] = useState(evening); // auto-open in the evening
  const [handled, setHandled] = useState<Set<string>>(new Set());

  if (pending.length === 0) return null;
  const left = pending.filter((p) => !handled.has(p.id));

  const drop = (id: string) =>
    start(async () => {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "skip" }),
      });
      setHandled((h) => new Set(h).add(id));
      router.refresh();
    });

  const keep = (id: string) => setHandled((h) => new Set(h).add(id)); // stays pending → rolls to backlog

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-line bg-surface px-5 py-3 text-left text-sm font-bold text-muted hover:text-ink hover:border-muted transition-colors"
      >
        🌙 Wrap up the day — review {pending.length} unfinished task{pending.length === 1 ? "" : "s"} →
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-lime/40 bg-lime/5 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">🌙 End-of-day review</h2>
        <button onClick={() => setOpen(false)} className="text-muted text-xs uppercase font-bold">close</button>
      </div>
      {left.length === 0 ? (
        <p className="text-sm text-muted">All sorted. Kept tasks roll into tomorrow&apos;s backlog; dropped ones are skipped. 🌙</p>
      ) : (
        <>
          <p className="text-muted text-xs">Keep = carry to backlog · Drop = skip it.</p>
          <div className="rounded-xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {left.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{p.icon ? `${p.icon} ` : ""}{p.title}</div>
                  <div className="text-muted text-[10px] uppercase font-semibold">{p.area}</div>
                </div>
                <button onClick={() => keep(p.id)} className="shrink-0 text-[11px] font-black uppercase bg-lime/15 text-lime border border-lime/30 rounded-md px-3 py-1.5">Keep</button>
                <button onClick={() => drop(p.id)} className="shrink-0 text-[11px] font-black uppercase bg-surface2 border border-line text-muted hover:text-hot rounded-md px-3 py-1.5">Drop</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
