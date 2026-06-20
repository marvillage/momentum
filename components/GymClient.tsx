"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DOW } from "@/lib/constants";

type Ex = { id: string; dow: number; name: string; sets: number; reps: number; weight: number; order: number };
type W = { date: string; kg: number };
type R = { date: string; intensity: number };
type S = { id: string; exercise: string; reps: number; weight: number };

const fieldCls = "bg-surface2 border border-line rounded-lg px-2.5 py-2 text-sm text-ink focus:border-lime outline-none";

// Per-exercise set logger shown under each of today's exercises.
function ExerciseLogger({ ex, sets, onLog, onDel }: { ex: Ex; sets: S[]; onLog: (reps: number, weight: number) => void; onDel: (id: string) => void }) {
  const [reps, setReps] = useState(String(ex.reps));
  const [weight, setWeight] = useState(String(ex.weight));
  const hitAll = sets.length >= ex.sets && sets.length > 0 && sets.every((s) => s.reps >= ex.reps);
  const inp = "bg-ground border border-line rounded-md px-2 py-1 text-xs w-14 text-center outline-none focus:border-lime";

  return (
    <div className="border-t border-line pt-2 space-y-1.5">
      {sets.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 text-xs">
          <span className="text-muted w-10">Set {i + 1}</span>
          <span className="font-bold tabular-nums">{s.reps} × {s.weight}kg</span>
          <button onClick={() => onDel(s.id)} className="text-hot ml-auto px-1">✕</button>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <input className={inp} type="number" value={reps} onChange={(e) => setReps(e.target.value)} title="reps" />
        <span className="text-muted text-xs">×</span>
        <input className={inp} type="number" step="2.5" value={weight} onChange={(e) => setWeight(e.target.value)} title="kg" />
        <span className="text-muted text-xs">kg</span>
        <button
          onClick={() => onLog(Math.max(0, parseInt(reps || "0", 10)), Math.max(0, parseFloat(weight || "0")))}
          className="ml-auto bg-lime/15 text-lime border border-lime/30 rounded-md px-2.5 py-1 text-[11px] font-black uppercase"
        >
          + Set
        </button>
      </div>
      {hitAll && <p className="text-[11px] font-bold text-lime">💪 Hit all {ex.sets} sets — try +2.5kg next time.</p>}
    </div>
  );
}

// Beast scale — 1..5
export const INTENSITY: Record<number, { label: string; emoji: string }> = {
  5: { label: "Beast", emoji: "🔥" },
  4: { label: "Strong", emoji: "💪" },
  3: { label: "Solid", emoji: "👍" },
  2: { label: "Light", emoji: "🙂" },
  1: { label: "Barely", emoji: "😮‍💨" },
};

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

export function GymClient({
  today,
  exercises,
  weights,
  todayRating,
  ratings,
  todaySets,
}: {
  today: number;
  exercises: Ex[];
  weights: W[];
  todayRating: number | null;
  ratings: R[];
  todaySets: S[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [day, setDay] = useState(today);
  const [kg, setKg] = useState("");
  const [form, setForm] = useState({ name: "", sets: 3, reps: 8, weight: 0 });

  const refresh = () => router.refresh();

  const rate = (intensity: number) =>
    start(async () => {
      await fetch("/api/gym/intensity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intensity }),
      });
      refresh();
    });

  const avgIntensity = ratings.length ? ratings.reduce((s, r) => s + r.intensity, 0) / ratings.length : 0;
  const avgLabel = avgIntensity ? INTENSITY[Math.round(avgIntensity)]?.label : "";
  const trend = [...ratings].reverse(); // oldest → newest

  const logSet = (exercise: string, reps: number, weight: number) =>
    start(async () => {
      await fetch("/api/gym/sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exercise, reps, weight }),
      });
      refresh();
    });

  const delSet = (id: string) =>
    start(async () => {
      await fetch(`/api/gym/sets/${id}`, { method: "DELETE" });
      refresh();
    });
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

      {/* workout intensity */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-lime">Workout intensity</h2>
          {avgIntensity > 0 && (
            <span className="text-muted text-xs font-bold uppercase">
              avg {avgIntensity.toFixed(1)} · {avgLabel}
            </span>
          )}
        </div>
        <p className="text-muted text-sm">How hard did you go today?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => rate(n)}
              className={`flex-1 rounded-xl border px-2 py-3 text-center transition-colors ${
                todayRating === n ? "border-lime bg-lime/10" : "border-line hover:border-muted"
              }`}
            >
              <div className="text-xl">{INTENSITY[n].emoji}</div>
              <div className="text-[10px] font-black uppercase tracking-wide mt-1">{INTENSITY[n].label}</div>
            </button>
          ))}
        </div>
        {todayRating && (
          <p className="text-xs font-bold text-lime">
            Logged today: {INTENSITY[todayRating].emoji} {INTENSITY[todayRating].label} ({todayRating}/5)
            {todayRating >= 5 ? " — excellent!" : todayRating >= 4 ? " — strong work" : todayRating >= 3 ? " — solid" : ""}
          </p>
        )}
        {trend.length >= 2 && (
          <div className="flex items-end gap-1 h-10 pt-1">
            {trend.map((r) => (
              <div
                key={r.date}
                className="flex-1 rounded-t bg-lime/70"
                style={{ height: `${(r.intensity / 5) * 100}%` }}
                title={`${r.date}: ${r.intensity}/5`}
              />
            ))}
          </div>
        )}
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
            <div key={e.id} className="bg-surface2 border border-line rounded-xl px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-2">
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
              {day === today && (
                <ExerciseLogger
                  ex={e}
                  sets={todaySets.filter((s) => s.exercise === e.name)}
                  onLog={(reps, weight) => logSet(e.name, reps, weight)}
                  onDel={delSet}
                />
              )}
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
