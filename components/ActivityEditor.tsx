"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AREAS, CADENCES, DOW } from "@/lib/constants";

type Item = { id: string; title: string; url: string | null; done: boolean; order: number };
type GroupOpt = { id: string; name: string; icon: string | null };
type Activity = {
  id: string;
  name: string;
  area: string;
  type: string;
  icon: string | null;
  link: string | null;
  groupId: string | null;
  cadence: string;
  daysOfWeek: string | null;
  biweeklyDays: string | null;
  everyNDays: number | null;
  durationMin: number | null;
  targetCount: number;
  minCount: number | null;
  unit: string | null;
  active: boolean;
  rollover: boolean;
  items: Item[];
};

const fieldCls =
  "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";
const labelCls = "text-[11px] font-black uppercase tracking-widest text-muted";

// Inline-editable queue item: edit title + url, toggle done, delete.
function ItemRow({ item, onChange }: { item: Item; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const save = async (data: Record<string, unknown>) => {
    await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    onChange();
  };
  const del = async () => { await fetch(`/api/items/${item.id}`, { method: "DELETE" }); onChange(); };
  return (
    <div className="px-3 py-2 text-sm space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted text-xs w-6 shrink-0">{item.order + 1}</span>
        <input
          defaultValue={item.title}
          onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== item.title && save({ title: e.target.value.trim() })}
          className={`flex-1 bg-transparent outline-none focus:text-lime ${item.done ? "line-through text-muted" : ""}`}
        />
        {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-lime text-xs shrink-0">▶</a>}
        <button onClick={() => setOpen((o) => !o)} title="Edit link" className="text-muted hover:text-ink text-xs shrink-0">✎</button>
        <button onClick={() => save({ done: !item.done })} title="Toggle done" className={`text-xs shrink-0 ${item.done ? "text-lime" : "text-muted hover:text-ink"}`}>✓</button>
        <button onClick={del} className="text-hot text-xs shrink-0 px-1">✕</button>
      </div>
      {open && (
        <input
          defaultValue={item.url ?? ""}
          placeholder="https://…"
          onBlur={(e) => save({ url: e.target.value.trim() || null })}
          className="w-full bg-surface2 border border-line rounded px-2 py-1 text-xs outline-none focus:border-lime"
        />
      )}
    </div>
  );
}

export function ActivityEditor({ activity, groups }: { activity: Activity; groups: GroupOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [a, setA] = useState(activity);
  const [paste, setPaste] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [msg, setMsg] = useState("");
  const [yt, setYt] = useState("");

  const importYt = () =>
    start(async () => {
      const res = await fetch("/api/items/youtube", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId: a.id, playlist: yt, mode }),
      });
      const j = await res.json();
      setMsg(res.ok ? `Imported ${j.added} videos.` : j.error || "Failed");
      setYt("");
      router.refresh();
    });

  const days = new Set((a.daysOfWeek || "").split(",").filter(Boolean).map(Number));
  const bdays = new Set((a.biweeklyDays || "").split(",").filter(Boolean).map(Number));

  const patch = (data: Partial<Activity>) => {
    const next = { ...a, ...data };
    setA(next);
    start(async () => {
      await fetch(`/api/activities/${a.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    });
  };

  const toggleDay = (n: number) => {
    const s = new Set(days);
    if (s.has(n)) s.delete(n);
    else s.add(n);
    patch({ daysOfWeek: [...s].sort((x, y) => x - y).join(",") });
  };

  const toggleBiweeklyDay = (n: number) => {
    const s = new Set(bdays);
    if (s.has(n)) s.delete(n);
    else s.add(n);
    patch({ biweeklyDays: s.size ? [...s].sort((x, y) => x - y).join(",") : null });
  };

  const upload = () =>
    start(async () => {
      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId: a.id, text: paste, mode }),
      });
      const j = await res.json();
      setMsg(res.ok ? `Added ${j.added} items.` : j.error || "Failed");
      setPaste("");
      router.refresh();
    });

  // Read the queue from the live prop (refreshed after upload/import/delete)
  // so newly added items appear without a full page reload.
  const items = activity.items;
  const remaining = items.filter((i) => !i.done).length;

  return (
    <div className={`space-y-8 ${pending ? "opacity-70" : ""}`}>
      {/* settings */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">Schedule</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 col-span-2">
            <span className={labelCls}>Name</span>
            <input className={fieldCls} defaultValue={a.name}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== a.name && patch({ name: e.target.value.trim() })} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Group</span>
            <select className={fieldCls} value={a.groupId ?? ""} onChange={(e) => patch({ groupId: e.target.value || null })}>
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.icon ? `${g.icon} ` : ""}{g.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Icon</span>
            <input className={fieldCls} maxLength={2} placeholder="🎯" defaultValue={a.icon ?? ""}
              onBlur={(e) => e.target.value !== (a.icon ?? "") && patch({ icon: e.target.value.trim() || null })} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Area</span>
            <select className={fieldCls} value={a.area} onChange={(e) => patch({ area: e.target.value })}>
              {AREAS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Duration (min)</span>
            <input type="number" min={0} className={fieldCls} placeholder="—" defaultValue={a.durationMin ?? ""}
              onBlur={(e) => patch({ durationMin: e.target.value ? parseInt(e.target.value, 10) : null })} />
          </label>
          <label className="flex flex-col gap-1.5 col-span-2">
            <span className={labelCls}>Quick-open link</span>
            <input className={fieldCls} placeholder="https://… (e.g. the doc you're writing)" defaultValue={a.link ?? ""}
              onBlur={(e) => e.target.value !== (a.link ?? "") && patch({ link: e.target.value.trim() || null })} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Cadence</span>
            <select className={fieldCls} value={a.cadence} onChange={(e) => patch({ cadence: e.target.value })}>
              {CADENCES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Daily target</span>
            <input
              type="number"
              min={1}
              className={fieldCls}
              defaultValue={a.targetCount}
              onBlur={(e) => {
                const v = Math.max(1, parseInt(e.target.value || "1", 10));
                if (v !== a.targetCount) patch({ targetCount: v });
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Minimum (optional)</span>
            <input
              type="number"
              min={0}
              className={fieldCls}
              defaultValue={a.minCount ?? ""}
              placeholder="—"
              onBlur={(e) => {
                const v = e.target.value ? parseInt(e.target.value, 10) : null;
                if (v !== a.minCount) patch({ minCount: v });
              }}
            />
          </label>
        </div>

        {a.cadence === "EVERY_N" && (
          <label className="flex items-center gap-2 text-sm">
            <span className={labelCls}>Every</span>
            <input type="number" min={1} className={`${fieldCls} w-20`} defaultValue={a.everyNDays ?? 2}
              onBlur={(e) => patch({ everyNDays: Math.max(1, parseInt(e.target.value || "2", 10)) })} />
            <span className="text-muted">days</span>
          </label>
        )}

        {a.cadence === "DAYS" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className={labelCls}>Weekly on</span>
              <div className="flex gap-1.5 flex-wrap">
                {DOW.map((d) => (
                  <button
                    key={d.n}
                    onClick={() => toggleDay(d.n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${
                      days.has(d.n) ? "bg-lime text-ground border-lime" : "border-line text-muted hover:border-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={labelCls}>…plus every other week on</span>
              <div className="flex gap-1.5 flex-wrap">
                {DOW.map((d) => (
                  <button
                    key={d.n}
                    onClick={() => toggleBiweeklyDay(d.n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${
                      bdays.has(d.n) ? "bg-lime text-ground border-lime" : "border-line text-muted hover:border-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => patch({ active: !a.active })}
            className={`text-xs font-black uppercase px-3 py-2 rounded-lg border ${
              a.active ? "bg-lime/15 text-lime border-lime/40" : "bg-surface2 text-muted border-line"
            }`}
          >
            {a.active ? "Active — showing in Today" : "Paused — hidden from Today"}
          </button>
          <button
            onClick={() => patch({ rollover: !a.rollover })}
            className={`text-xs font-black uppercase px-3 py-2 rounded-lg border ${
              a.rollover ? "bg-lime/15 text-lime border-lime/40" : "bg-surface2 text-muted border-line"
            }`}
          >
            {a.rollover ? "Rolls to backlog" : "No backlog — just lapses"}
          </button>
        </div>
      </div>

      {/* content queue */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-lime">Content queue</h2>
          <span className="text-xs font-bold text-muted uppercase">
            {items.length} items · {remaining} left
          </span>
        </div>
        <p className="text-muted text-sm">
          Paste your Striver sheet / playlist — one per line. Formats: <code>Title | https://link</code>,
          a markdown <code>[Title](link)</code>, or just a title. The next un-done item shows in Today each day.
        </p>
        <textarea
          className={`${fieldCls} w-full h-32 font-mono text-xs`}
          placeholder={"Two Sum | https://leetcode.com/problems/two-sum\nGradient Descent | https://youtu.be/..."}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <select className={fieldCls} value={mode} onChange={(e) => setMode(e.target.value as "append" | "replace")}>
            <option value="append">Add to queue</option>
            <option value="replace">Replace queue</option>
          </select>
          <button
            onClick={upload}
            disabled={!paste.trim()}
            className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40"
          >
            Upload
          </button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-4">
          <input
            className={`${fieldCls} flex-1`}
            placeholder="Paste a YouTube playlist link to auto-import…"
            value={yt}
            onChange={(e) => setYt(e.target.value)}
          />
          <button
            onClick={importYt}
            disabled={!yt.trim()}
            className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40 shrink-0"
          >
            Import ▶
          </button>
        </div>

        {items.length > 0 && (
          <div className="rounded-xl border border-line divide-y divide-line max-h-80 overflow-y-auto">
            {items.map((it) => (
              <ItemRow key={it.id} item={it} onChange={() => router.refresh()} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
