"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Log = { id: string; bucket: string; name: string; kcal: number; protein: number };
type Bucket = { key: string; label: string };

const field = "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";

function Bar({ label, value, target, unit, hot }: { label: string; value: number; target: number; unit: string; hot?: boolean }) {
  const pct = target > 0 ? Math.min(100, Math.round((100 * value) / target)) : 0;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-muted text-xs font-bold uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-muted">
          <span className={`text-2xl font-black ${value >= target ? "text-lime" : "text-ink"}`}>{value}</span> / {target} {unit}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-surface2 overflow-hidden">
        <div className={`h-full rounded-full ${hot ? "bg-hot" : "bg-lime"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FoodClient({
  logs,
  kcal,
  protein,
  kcalTarget,
  proteinTarget,
  buckets,
  current,
  loggedBuckets,
}: {
  logs: Log[];
  kcal: number;
  protein: number;
  kcalTarget: number;
  proteinTarget: number;
  buckets: Bucket[];
  current: string;
  loggedBuckets: string[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [bucket, setBucket] = useState(current);
  const [name, setName] = useState("");
  const [kc, setKc] = useState("");
  const [pr, setPr] = useState("");
  const [editing, setEditing] = useState(false);
  const [kt, setKt] = useState(String(kcalTarget));
  const [pt, setPt] = useState(String(proteinTarget));

  const refresh = () => router.refresh();
  const curLabel = buckets.find((b) => b.key === current)?.label ?? "a meal";
  const promptOpen = !loggedBuckets.includes(current);

  const add = () =>
    start(async () => {
      await fetch("/api/food", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bucket, name, kcal: kc, protein: pr }),
      });
      setName(""); setKc(""); setPr(""); refresh();
    });

  const del = (id: string) =>
    start(async () => {
      await fetch(`/api/food/${id}`, { method: "DELETE" });
      refresh();
    });

  const saveTargets = () =>
    start(async () => {
      await fetch("/api/food/targets", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kcalTarget: kt, proteinTarget: pt }),
      });
      setEditing(false); refresh();
    });

  return (
    <div className="space-y-6">
      {/* prompt */}
      {promptOpen && (
        <div className="rounded-2xl border border-lime/40 bg-lime/10 p-4">
          <p className="font-bold text-sm">🍽 What did you eat for {curLabel.toLowerCase()}?</p>
          <p className="text-muted text-xs mt-0.5">Log it below so your day stays accurate.</p>
        </div>
      )}

      {/* progress */}
      <div className="grid grid-cols-2 gap-4">
        <Bar label="Protein" value={protein} target={proteinTarget} unit="g" />
        <Bar label="Calories" value={kcal} target={kcalTarget} unit="kcal" hot={kcal > kcalTarget} />
      </div>
      <button onClick={() => setEditing((e) => !e)} className="text-muted text-xs font-bold uppercase hover:text-ink">
        {editing ? "close" : "edit targets"}
      </button>
      {editing && (
        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-surface p-4">
          <label className="flex flex-col gap-1 text-[11px] font-black uppercase text-muted">Protein g
            <input type="number" className={`${field} w-28`} value={pt} onChange={(e) => setPt(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-black uppercase text-muted">Calories
            <input type="number" className={`${field} w-28`} value={kt} onChange={(e) => setKt(e.target.value)} />
          </label>
          <button onClick={saveTargets} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg">Save</button>
        </div>
      )}

      {/* add */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {buckets.map((b) => (
            <button key={b.key} onClick={() => setBucket(b.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${bucket === b.key ? "bg-lime text-ground border-lime" : "border-line text-muted hover:border-muted"} ${b.key === current ? "ring-1 ring-lime/40" : ""}`}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <input className={`${field} flex-1 min-w-[160px]`} placeholder="Food (e.g. 2 roti + dal + curd)" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && add()} />
          <input className={`${field} w-24`} type="number" placeholder="protein g" value={pr} onChange={(e) => setPr(e.target.value)} />
          <input className={`${field} w-24`} type="number" placeholder="kcal" value={kc} onChange={(e) => setKc(e.target.value)} />
          <button onClick={add} disabled={!name.trim()} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">Log</button>
        </div>
      </div>

      {/* today's log by bucket */}
      <div className="space-y-4">
        {buckets.map((b) => {
          const rows = logs.filter((l) => l.bucket === b.key);
          if (rows.length === 0) return null;
          return (
            <div key={b.key}>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-2">{b.label}</h3>
              <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                {rows.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{l.name}</div>
                      <div className="text-muted text-[11px] font-semibold uppercase">{l.protein}g protein · {l.kcal} kcal</div>
                    </div>
                    <button onClick={() => del(l.id)} className="text-hot text-sm px-1 shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-muted text-sm">Nothing logged today. Add your first meal above.</p>}
      </div>
    </div>
  );
}
