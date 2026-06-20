"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; name: string; slug: string; icon: string | null; kind: string; sortOrder: number; count: number };

const field = "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";

export function GroupManager({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [kind, setKind] = useState<"NORMAL" | "GYM">("NORMAL");

  const refresh = () => router.refresh();

  const create = () =>
    start(async () => {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, icon: icon.trim() || null, kind }),
      });
      setName(""); setIcon(""); setKind("NORMAL"); setOpen(false); refresh();
    });

  const patch = (id: string, data: Record<string, unknown>) =>
    start(async () => {
      await fetch(`/api/groups/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      refresh();
    });

  const del = (g: Group) =>
    start(async () => {
      if (!confirm(`Delete "${g.name}"? Its ${g.count} activit${g.count === 1 ? "y" : "ies"} will be kept (ungrouped).`)) return;
      await fetch(`/api/groups/${g.id}`, { method: "DELETE" });
      refresh();
    });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const a = groups[i], b = groups[j];
    patch(a.id, { sortOrder: b.sortOrder });
    patch(b.id, { sortOrder: a.sortOrder });
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">Navbar groups</h2>
        <button onClick={() => setOpen((o) => !o)} className="text-xs font-black uppercase text-muted hover:text-ink">
          {open ? "close" : "+ group"}
        </button>
      </div>

      {open && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
          <input className={`${field} w-14 text-center`} placeholder="💡" maxLength={2} value={icon} onChange={(e) => setIcon(e.target.value)} />
          <input className={`${field} flex-1 min-w-[140px]`} placeholder="Group name (e.g. Coding, Skincare)" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={field} value={kind} onChange={(e) => setKind(e.target.value as "NORMAL" | "GYM")}>
            <option value="NORMAL">Normal</option>
            <option value="GYM">Gym module</option>
          </select>
          <button onClick={create} disabled={!name.trim()} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">Add</button>
        </div>
      )}

      <div className="space-y-1.5">
        {groups.length === 0 && <p className="text-muted text-sm">No groups yet. Add one to create a navbar section.</p>}
        {groups.map((g, i) => (
          <div key={g.id} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2">
            <input className="w-9 bg-transparent text-center outline-none" defaultValue={g.icon ?? ""} maxLength={2}
              onBlur={(e) => e.target.value !== (g.icon ?? "") && patch(g.id, { icon: e.target.value.trim() || null })} />
            <input className="flex-1 min-w-0 bg-transparent font-bold outline-none focus:text-lime"
              defaultValue={g.name} onBlur={(e) => e.target.value.trim() && e.target.value !== g.name && patch(g.id, { name: e.target.value.trim() })} />
            <span className="text-muted text-[11px] uppercase font-bold shrink-0">
              {g.kind === "GYM" ? "gym · " : ""}{g.count} act
            </span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted hover:text-ink disabled:opacity-30 px-1">↑</button>
            <button onClick={() => move(i, 1)} disabled={i === groups.length - 1} className="text-muted hover:text-ink disabled:opacity-30 px-1">↓</button>
            <button onClick={() => del(g)} className="text-hot px-1">✕</button>
          </div>
        ))}
      </div>
      <p className="text-muted text-[11px]">Tap a name or emoji to rename. A group appears in the navbar only when it has an active activity.</p>
    </div>
  );
}
