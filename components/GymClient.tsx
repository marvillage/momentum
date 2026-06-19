"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DOW } from "@/lib/constants";

type Ex = { id: string; dow: number; name: string; sets: number; reps: number; weight: number; order: number };
type W = { date: string; kg: number };

const fieldCls = "bg-surface2 border border-line rounded-lg px-2.5 py-2 text-sm text-ink focus:border-lime outline-none";

function Sparkline({ data }: { data: W[] }) {
  if (data.length < 2) return null;
  const kgs = data.map((d) => d.kg);
  const min = Math.min(...kgs),
    max = Math.max(...kgs);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * 100},${28 - ((d.kg - min) / span) * 24 - 2}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="w-full h-12">
      <polyline points={pts} fill="none" stroke="#c6f833" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function GymClient({ today, exercises, weights }: { today: number; exercises: Ex[]; weights: W[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [day, setDay] = useState(today);
  const [kg, setKg] = useState("");
  const [form, setForm] = useState({ name: "", sets: 3, reps: 8, weight: 0 });

  const refresh = () => router.refresh();
  const dayEx = exercises.filter((e) => e.dow === day).sort((a, b) => a.order - b.order);
  const latest = weights[weights.length - 1];

  const logWeight = () =>
    start(async () => {
      await fetch("/api/gym/bodyweight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kg }),
      });
      setKg("");
      refresh();
    });

  const addEx = () =>
    start(async () => {
      await fetch("/api/gym/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, dow: day }),
      });
      setForm({ name: "", sets: 3, reps: 8, weight: 0 });
      refresh();
    });

  const bumpWeight = (e: Ex, delta: number) =>
    start(async () => {
      await fetch(`/api/gym/exercises/${e.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weight: Math.max(0, e.weight + delta) }),
      });
      refresh();
    });

  const delEx = (id: string) =>
    start(async () => {
      await fetch(`/api/gym/exercises/${id}`, { method: "DELETE" });
      refresh();
    });

  return (
    <div className="space-y-8">
      {/* bodyweight */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-lime">Bodyweight</h2>
          {latest && (
            <span className="text-2xl font-black">
              {latest.kg}
              <span className="text-muted text-sm font-bold"> kg</span>
            </span>
          )}
        </div>
        <Sparkline data={weights} />
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            className={fieldCls}
            placeholder="today's weight"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
          />
          <button
            onClick={logWeight}
            disabled={!kg}
            className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40"
          >
            Log
          </button>
        </div>
      </div>

      {/* split editor */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">Your split</h2>
        <div className="flex gap-1.5 flex-wrap">
          {DOW.map((d) => (
            <button
              key={d.n}
              onClick={() => setDay(d.n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${
                day === d.n ? "bg-lime text-ground border-lime" : "border-line text-muted hover:border-muted"
              } ${d.n === today ? "ring-1 ring-lime/40" : ""}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {dayEx.length === 0 && <p className="text-muted text-sm">Rest day — or add exercises below.</p>}
          {dayEx.map((e) => (
            <div key={e.id} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{e.name}</div>
                <div className="text-muted text-[11px] font-semibold uppercase">
                  {e.sets} × {e.reps}
                </div>
              </div>
              <button onClick={() => bumpWeight(e, -2.5)} className="size-7 rounded-md bg-ground border border-line font-black">
                −
              </button>
              <span className="font-black tabular-nums w-16 text-center">
                {e.weight}
                <span className="text-muted text-xs"> kg</span>
              </span>
              <button onClick={() => bumpWeight(e, 2.5)} className="size-7 rounded-md bg-ground border border-line font-black">
                +
              </button>
              <button onClick={() => delEx(e.id)} className="text-hot text-sm px-1">
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* add exercise */}
        <div className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input
            className={`${fieldCls} flex-1 min-w-[140px]`}
            placeholder="Exercise (e.g. Bench press)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input className={`${fieldCls} w-14`} type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: +e.target.value })} title="sets" />
          <span className="text-muted">×</span>
          <input className={`${fieldCls} w-14`} type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: +e.target.value })} title="reps" />
          <input className={`${fieldCls} w-20`} type="number" step="2.5" value={form.weight} onChange={(e) => setForm({ ...form, weight: +e.target.value })} title="kg" />
          <button
            onClick={addEx}
            disabled={!form.name.trim()}
            className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
