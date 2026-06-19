"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AREAS } from "@/lib/constants";

export function NewActivity() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("HABIT");

  const create = () =>
    start(async () => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, area }),
      });
      const a = await res.json();
      if (res.ok) router.push(`/activities/${a.id}`);
    });

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg"
      >
        + New activity
      </button>
    );

  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? "opacity-60" : ""}`}>
      <input
        autoFocus
        className="bg-surface2 border border-line rounded-lg px-3 py-2 text-sm focus:border-lime outline-none"
        placeholder="Habit name (e.g. Read 20 min)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && create()}
      />
      <select
        className="bg-surface2 border border-line rounded-lg px-3 py-2 text-sm"
        value={area}
        onChange={(e) => setArea(e.target.value)}
      >
        {AREAS.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <button
        onClick={create}
        disabled={!name.trim()}
        className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40"
      >
        Create
      </button>
      <button onClick={() => setOpen(false)} className="text-muted text-xs px-2">
        cancel
      </button>
    </div>
  );
}
