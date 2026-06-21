"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Spec = {
  name: string; icon: string; area: string; type: string; group: string;
  cadence: string; daysOfWeek?: number[]; everyNDays?: number; targetCount: number; unit?: string;
  metrics: { label: string; unit?: string; kind: string }[];
  contentType: string; leetcodeTrack?: string; description?: string;
};

const DOWL = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const field = "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";

function freqText(s: Spec) {
  if (s.cadence === "DAYS") return (s.daysOfWeek || []).map((d) => DOWL[d]).join(", ") || "specific days";
  if (s.cadence === "EVERY_N") return `every ${s.everyNDays || 2} days`;
  if (s.cadence === "WEEKDAYS") return "weekdays";
  if (s.cadence === "WEEKLY") return "weekly";
  return "every day";
}

export function AiActivityBuilder({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const generate = async () => {
    setBusy(true); setMsg(""); setSpec(null);
    try {
      const r = await fetch("/api/ai/activity", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      if (r.ok) setSpec(j.spec);
      else setMsg(j.error || "Couldn't generate.");
    } catch { setMsg("Network error."); }
    setBusy(false);
  };

  const create = async () => {
    if (!spec) return;
    setBusy(true);
    const r = await fetch("/api/ai/activity/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ spec }) });
    const j = await r.json();
    setBusy(false);
    if (r.ok) router.push(`/activities/${j.id}`);
    else setMsg(j.error || "Couldn't create.");
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-2xl border border-lime/40 bg-lime/10 px-5 py-3 text-left font-bold text-lime hover:bg-lime/15 transition-colors">
        ✨ Describe an activity — let AI build it
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-lime/40 bg-surface p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">✨ AI activity builder</h2>
        <button onClick={() => { setOpen(false); setSpec(null); setPrompt(""); setMsg(""); }} className="text-muted text-xs uppercase font-bold">close</button>
      </div>

      {!enabled && <p className="text-hot text-xs font-bold">AI key not set — add GEMINI_API_KEY to enable.</p>}

      <textarea
        className={`${field} w-full h-20`}
        placeholder="e.g. track my 5k runs 4 times a week · learn system design from a youtube playlist · drink 3L water daily · LeetCode 4 problems a day"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button onClick={generate} disabled={!prompt.trim() || busy} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">
          {busy && !spec ? "Thinking…" : "Generate"}
        </button>
        {msg && <span className="text-xs text-hot font-bold">{msg}</span>}
      </div>

      {spec && (
        <div className="rounded-xl border border-line bg-surface2 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input className={`${field} w-14 text-center`} value={spec.icon} maxLength={2} onChange={(e) => setSpec({ ...spec, icon: e.target.value })} />
            <input className={`${field} flex-1`} value={spec.name} onChange={(e) => setSpec({ ...spec, name: e.target.value })} />
          </div>
          {spec.description && <p className="text-muted text-xs">{spec.description}</p>}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold uppercase">
            <span className="bg-lime/15 text-lime border border-lime/30 rounded px-2 py-1">{spec.type}</span>
            <span className="bg-surface border border-line rounded px-2 py-1">📂 {spec.group}</span>
            <span className="bg-surface border border-line rounded px-2 py-1">{freqText(spec)}</span>
            <span className="bg-surface border border-line rounded px-2 py-1">target {spec.targetCount}{spec.unit ? ` ${spec.unit}` : ""}</span>
            {spec.contentType === "LEETCODE" && spec.leetcodeTrack !== "none" && <span className="bg-surface border border-line rounded px-2 py-1">⬇ {spec.leetcodeTrack}</span>}
            {spec.contentType === "YOUTUBE" && <span className="bg-surface border border-line rounded px-2 py-1">▶ paste playlist after</span>}
          </div>
          {spec.metrics?.length > 0 && (
            <div className="text-xs text-muted">
              Tracks: {spec.metrics.map((m) => `${m.label}${m.unit ? ` (${m.unit})` : ""}`).join(" · ")}
            </div>
          )}
          <button onClick={create} disabled={busy} className="w-full bg-lime text-ground font-black uppercase text-xs px-4 py-3 rounded-lg disabled:opacity-40">
            {busy ? "Creating…" : "Create this activity →"}
          </button>
        </div>
      )}
    </div>
  );
}
