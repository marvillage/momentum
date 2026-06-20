"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AREAS, DOW } from "@/lib/constants";

type GroupOpt = { id: string; name: string; icon: string | null };
type TrackOpt = { key: string; name: string; blurb: string; type: string; count: number };

const TYPES = [
  { key: "PROBLEMS", label: "Coding / problems", hint: "Auto-load a problem track with links (Blind 75, NeetCode 150…)" },
  { key: "VIDEO", label: "Video course", hint: "A playlist/course — track the next video each day" },
  { key: "GYM", label: "Gym", hint: "A workout — configure the split & weights in the Gym tab" },
  { key: "WEEKLY", label: "Weekly goal", hint: "A target per week (e.g. 3 Medium stories)" },
  { key: "SIMPLE", label: "Simple habit", hint: "A daily checkbox or counter" },
];

const field = "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";
const lbl = "text-[11px] font-black uppercase tracking-widest text-muted";

export function NewActivity({
  groups,
  tracks,
  redirectOnCreate = true,
  onCreated,
}: {
  groups: GroupOpt[];
  tracks: TrackOpt[];
  redirectOnCreate?: boolean;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const [type, setType] = useState("SIMPLE");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [link, setLink] = useState("");
  const [groupId, setGroupId] = useState("");
  const [area, setArea] = useState("HABIT");
  const [cadence, setCadence] = useState("DAILY");
  const [days, setDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [everyNDays, setEveryNDays] = useState(2);
  const [durationMin, setDurationMin] = useState("");
  const [target, setTarget] = useState(1);
  const [minCount, setMinCount] = useState("");
  const [unit, setUnit] = useState("");
  const [track, setTrack] = useState("");

  const codingTracks = tracks.filter((t) => t.type === "PROBLEMS");
  const videoTracks = tracks.filter((t) => t.type === "VIDEO");
  const shownTracks = type === "PROBLEMS" ? codingTracks : type === "VIDEO" ? videoTracks : [];

  const reset = () => {
    setType("SIMPLE"); setName(""); setIcon(""); setLink(""); setGroupId(""); setArea("HABIT");
    setCadence("DAILY"); setDays(new Set([1, 2, 3, 4, 5])); setEveryNDays(2);
    setDurationMin(""); setTarget(1); setMinCount(""); setUnit(""); setTrack("");
  };

  const pickType = (t: string) => {
    setType(t);
    if (t === "WEEKLY") setCadence("WEEKLY");
    else if (cadence === "WEEKLY") setCadence("DAILY");
    if (t === "PROBLEMS") { setTarget(4); setUnit("questions"); }
    if (t === "VIDEO") { setTarget(1); setUnit("video"); }
  };

  const toggleDay = (n: number) => {
    const s = new Set(days);
    if (s.has(n)) s.delete(n); else s.add(n);
    setDays(s);
  };

  const create = () =>
    start(async () => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          area,
          type,
          icon: icon.trim() || null,
          link: link.trim() || null,
          groupId: groupId || null,
          cadence,
          daysOfWeek: cadence === "DAYS" ? [...days].sort((a, b) => a - b).join(",") : null,
          everyNDays: cadence === "EVERY_N" ? everyNDays : null,
          durationMin: durationMin ? parseInt(durationMin, 10) : null,
          targetCount: Math.max(1, target),
          minCount: minCount ? parseInt(minCount, 10) : null,
          weeklyTarget: type === "WEEKLY" ? Math.max(1, target) : null,
          unit: unit.trim() || null,
          track: track || null,
        }),
      });
      const a = await res.json();
      if (res.ok) {
        reset();
        setOpen(false);
        if (redirectOnCreate) router.push(`/activities/${a.id}`);
        else { onCreated?.(); router.refresh(); }
      }
    });

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg">
        + New activity
      </button>
    );

  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 space-y-5 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">New activity</h2>
        <button onClick={() => { reset(); setOpen(false); }} className="text-muted text-xs uppercase font-bold">cancel</button>
      </div>

      {/* type picker */}
      <div className="grid gap-2">
        <span className={lbl}>Kind</span>
        <div className="grid sm:grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => pickType(t.key)}
              className={`text-left rounded-xl border px-3 py-2.5 ${type === t.key ? "border-lime bg-lime/10" : "border-line hover:border-muted"}`}
            >
              <div className="font-bold text-sm">{t.label}</div>
              <div className="text-muted text-[11px] mt-0.5">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* name + icon */}
      <div className="flex gap-2">
        <input className={`${field} w-16 text-center`} placeholder="🎯" value={icon} onChange={(e) => setIcon(e.target.value)} title="emoji" maxLength={2} />
        <input className={`${field} flex-1`} autoFocus placeholder="Name (e.g. LeetCode, Read 20 min)" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {/* quick-open link */}
      <input
        className={`${field} w-full`}
        placeholder="Quick-open link (optional) — e.g. the doc you're writing"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />

      {/* group + area */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Group (navbar)</span>
          <select className={field} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.icon ? `${g.icon} ` : ""}{g.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Area (tag)</span>
          <select className={field} value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
      </div>

      {/* frequency */}
      {type !== "WEEKLY" && (
        <div className="grid gap-2">
          <span className={lbl}>Frequency</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["DAILY", "Every day"],
              ["WEEKDAYS", "Weekdays"],
              ["DAYS", "Specific days"],
              ["EVERY_N", "Every N days"],
            ].map(([v, label]) => (
              <button key={v} onClick={() => setCadence(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${cadence === v ? "bg-lime text-ground border-lime" : "border-line text-muted hover:border-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          {cadence === "DAYS" && (
            <div className="flex gap-1.5 flex-wrap mt-1">
              {DOW.map((d) => (
                <button key={d.n} onClick={() => toggleDay(d.n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${days.has(d.n) ? "bg-lime text-ground border-lime" : "border-line text-muted hover:border-muted"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          )}
          {cadence === "EVERY_N" && (
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-muted">Every</span>
              <input type="number" min={1} className={`${field} w-20`} value={everyNDays} onChange={(e) => setEveryNDays(Math.max(1, +e.target.value))} />
              <span className="text-muted">days</span>
            </div>
          )}
        </div>
      )}

      {/* targets + duration */}
      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>{type === "WEEKLY" ? "Per week" : "Target / day"}</span>
          <input type="number" min={1} className={field} value={target} onChange={(e) => setTarget(Math.max(1, +e.target.value))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Min (opt)</span>
          <input type="number" min={0} className={field} placeholder="—" value={minCount} onChange={(e) => setMinCount(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Duration min (opt)</span>
          <input type="number" min={0} className={field} placeholder="—" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={lbl}>Unit (opt)</span>
        <input className={field} placeholder="questions · video · story · applications…" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </label>

      {/* track auto-load */}
      {shownTracks.length > 0 && (
        <div className="grid gap-2">
          <span className={lbl}>Auto-load content (optional)</span>
          <div className="grid gap-2">
            <button onClick={() => setTrack("")}
              className={`text-left rounded-xl border px-3 py-2 text-sm ${track === "" ? "border-lime bg-lime/10" : "border-line hover:border-muted"}`}>
              <span className="font-bold">None</span> <span className="text-muted text-xs">— I&apos;ll add my own in the editor</span>
            </button>
            {shownTracks.map((t) => (
              <button key={t.key} onClick={() => setTrack(t.key)}
                className={`text-left rounded-xl border px-3 py-2 ${track === t.key ? "border-lime bg-lime/10" : "border-line hover:border-muted"}`}>
                <div className="font-bold text-sm">{t.name} <span className="text-muted font-normal">· {t.count} items</span></div>
                <div className="text-muted text-[11px] mt-0.5">{t.blurb}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={create} disabled={!name.trim() || pending}
        className="w-full bg-lime text-ground font-black uppercase text-xs px-4 py-3 rounded-lg disabled:opacity-40">
        {pending ? "Creating…" : "Create activity"}
      </button>
    </div>
  );
}
