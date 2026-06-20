"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Log = { id: string; bucket: string; name: string; kcal: number; protein: number; carbs: number };
type Bucket = { key: string; label: string };
type Saved = { id: string; name: string; kcal: number; protein: number; carbs: number };
type Hist = { date: string; kcal: number; protein: number; water: number };
type Totals = { kcal: number; protein: number; carbs: number; waterMl: number };

const field = "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";

function LogRow({ log, onChange }: { log: Log; onChange: () => void }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: log.name, protein: String(log.protein), carbs: String(log.carbs), kcal: String(log.kcal) });
  const save = async () => {
    await fetch(`/api/food/${log.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    setEdit(false); onChange();
  };
  const del = async () => { await fetch(`/api/food/${log.id}`, { method: "DELETE" }); onChange(); };

  if (edit) {
    return (
      <div className="px-4 py-3 space-y-2">
        <input className={`${field} w-full`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="flex items-center gap-2">
          <input className={`${field} w-20`} type="number" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} title="protein" />
          <input className={`${field} w-20`} type="number" value={f.carbs} onChange={(e) => setF({ ...f, carbs: e.target.value })} title="carbs" />
          <input className={`${field} w-20`} type="number" value={f.kcal} onChange={(e) => setF({ ...f, kcal: e.target.value })} title="kcal" />
          <button onClick={save} className="bg-lime text-ground font-black uppercase text-[11px] px-3 py-2 rounded-lg ml-auto">Save</button>
          <button onClick={() => setEdit(false)} className="text-muted text-xs">cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate">{log.name}</div>
        <div className="text-muted text-[11px] font-semibold uppercase">{log.protein}g protein · {log.carbs}g carbs · {log.kcal} kcal</div>
      </div>
      <button onClick={() => setEdit(true)} className="text-muted hover:text-ink text-sm px-1 shrink-0">✎</button>
      <button onClick={del} className="text-hot text-sm px-1 shrink-0">✕</button>
    </div>
  );
}

function Bar({ label, value, target, unit, hot }: { label: string; value: number; target: number; unit: string; hot?: boolean }) {
  const pct = target > 0 ? Math.min(100, Math.round((100 * value) / target)) : 0;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-muted text-[11px] font-bold uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold text-muted">
          <span className={`text-xl font-black ${value >= target && target > 0 ? "text-lime" : "text-ink"}`}>{value}</span>/{target}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface2 overflow-hidden">
        <div className={`h-full rounded-full ${hot ? "bg-hot" : "bg-lime"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-muted text-[10px] uppercase mt-1">{unit}</div>
    </div>
  );
}

export function FoodClient({
  logs, totals, targets, saved, history, buckets, current, loggedBuckets,
}: {
  logs: Log[];
  totals: Totals;
  targets: Totals;
  saved: Saved[];
  history: Hist[];
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
  const [cb, setCb] = useState("");
  const [saveIt, setSaveIt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState({ kcal: String(targets.kcal), protein: String(targets.protein), carbs: String(targets.carbs), water: String(targets.waterMl) });

  const refresh = () => router.refresh();
  const curLabel = buckets.find((b) => b.key === current)?.label ?? "a meal";
  const promptOpen = !loggedBuckets.includes(current);

  const post = (body: object) => fetch("/api/food", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  const add = () => start(async () => {
    await post({ bucket, name, kcal: kc, protein: pr, carbs: cb, save: saveIt });
    setName(""); setKc(""); setPr(""); setCb(""); setSaveIt(false); refresh();
  });

  const quickAdd = (m: Saved) => start(async () => {
    await post({ bucket: current, name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, savedMealId: m.id });
    refresh();
  });

  const delSaved = (id: string) => start(async () => { await fetch(`/api/food/saved/${id}`, { method: "DELETE" }); refresh(); });

  const water = (ml: number) => start(async () => {
    await fetch("/api/food/water", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ml }) });
    refresh();
  });

  const saveTargets = () => start(async () => {
    await fetch("/api/food/targets", { method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ kcalTarget: t.kcal, proteinTarget: t.protein, carbsTarget: t.carbs, waterTargetMl: t.water }) });
    setEditing(false); refresh();
  });

  const maxKcal = Math.max(targets.kcal, ...history.map((h) => h.kcal), 1);

  return (
    <div className="space-y-6">
      {promptOpen && (
        <div className="rounded-2xl border border-lime/40 bg-lime/10 p-4">
          <p className="font-bold text-sm">🍽 What did you eat for {curLabel.toLowerCase()}?</p>
          <p className="text-muted text-xs mt-0.5">Log it below or tap a saved meal.</p>
        </div>
      )}

      {/* macro progress */}
      <div className="grid grid-cols-3 gap-3">
        <Bar label="Protein" value={totals.protein} target={targets.protein} unit="grams" />
        <Bar label="Carbs" value={totals.carbs} target={targets.carbs} unit="grams" />
        <Bar label="Calories" value={totals.kcal} target={targets.kcal} unit="kcal" hot={totals.kcal > targets.kcal} />
      </div>

      {/* water */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-lime">💧 Water</h2>
          <span className="text-xs font-bold text-muted">
            <span className={`text-xl font-black ${totals.waterMl >= targets.waterMl ? "text-lime" : "text-ink"}`}>{(totals.waterMl / 1000).toFixed(1)}</span> / {(targets.waterMl / 1000).toFixed(1)} L
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface2 overflow-hidden">
          <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, Math.round((100 * totals.waterMl) / targets.waterMl))}%` }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => water(250)} className="flex-1 bg-surface2 border border-line rounded-lg py-2 text-sm font-bold hover:border-lime">+ Glass (250ml)</button>
          <button onClick={() => water(500)} className="flex-1 bg-surface2 border border-line rounded-lg py-2 text-sm font-bold hover:border-lime">+ Bottle (500ml)</button>
          <button onClick={() => water(-1)} className="bg-surface2 border border-line rounded-lg px-3 text-sm font-bold text-muted hover:text-hot">undo</button>
        </div>
      </div>

      <button onClick={() => setEditing((e) => !e)} className="text-muted text-xs font-bold uppercase hover:text-ink">{editing ? "close" : "edit targets"}</button>
      {editing && (
        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-surface p-4">
          {([["protein", "Protein g"], ["carbs", "Carbs g"], ["kcal", "Calories"], ["water", "Water ml"]] as const).map(([k, lab]) => (
            <label key={k} className="flex flex-col gap-1 text-[11px] font-black uppercase text-muted">{lab}
              <input type="number" className={`${field} w-24`} value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
            </label>
          ))}
          <button onClick={saveTargets} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg">Save</button>
        </div>
      )}

      {/* saved meals quick-add */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted">Quick add</h2>
          <div className="flex flex-wrap gap-2">
            {saved.map((m) => (
              <span key={m.id} className="group inline-flex items-center gap-1.5 bg-surface2 border border-line rounded-full pl-3 pr-1.5 py-1.5">
                <button onClick={() => quickAdd(m)} className="text-sm font-bold hover:text-lime">{m.name} <span className="text-muted text-[11px]">{m.protein}p · {m.kcal}kcal</span></button>
                <button onClick={() => delSaved(m.id)} className="text-muted hover:text-hot text-xs">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* add form */}
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
          <input className={`${field} flex-1 min-w-[150px]`} placeholder="Food (e.g. 2 roti + dal)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && add()} />
          <input className={`${field} w-20`} type="number" placeholder="protein" value={pr} onChange={(e) => setPr(e.target.value)} />
          <input className={`${field} w-20`} type="number" placeholder="carbs" value={cb} onChange={(e) => setCb(e.target.value)} />
          <input className={`${field} w-20`} type="number" placeholder="kcal" value={kc} onChange={(e) => setKc(e.target.value)} />
          <button onClick={add} disabled={!name.trim()} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">Log</button>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted font-bold">
          <input type="checkbox" checked={saveIt} onChange={(e) => setSaveIt(e.target.checked)} /> Save for quick-add
        </label>
      </div>

      {/* today's log */}
      <div className="space-y-4">
        {buckets.map((b) => {
          const rows = logs.filter((l) => l.bucket === b.key);
          if (rows.length === 0) return null;
          return (
            <div key={b.key}>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-2">{b.label}</h3>
              <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                {rows.map((l) => (
                  <LogRow key={l.id} log={l} onChange={refresh} />
                ))}
              </div>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-muted text-sm">Nothing logged today. Add a meal or tap a quick-add above.</p>}
      </div>

      {/* 7-day history */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">Last 7 days</h2>
        <div className="flex items-end justify-between gap-2 h-28">
          {history.map((h) => {
            const day = new Date(h.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short" })[0];
            const hit = h.kcal > 0;
            return (
              <div key={h.date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex-1 flex items-end">
                  <div className="w-full rounded-t bg-lime/70" style={{ height: `${Math.round((100 * h.kcal) / maxKcal)}%` }} title={`${h.kcal} kcal · ${h.protein}g protein`} />
                </div>
                <span className={`text-[10px] font-bold ${hit ? "text-muted" : "text-muted/40"}`}>{day}</span>
              </div>
            );
          })}
        </div>
        <p className="text-muted text-[11px] mt-2 uppercase tracking-wide">Bar height = calories. Tap-hold for the day's numbers.</p>
      </div>
    </div>
  );
}
