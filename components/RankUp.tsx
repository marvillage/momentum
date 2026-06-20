"use client";

import { useEffect, useState } from "react";

// Fires once when the user reaches a new (higher) rank.
export function RankUp({ active, rank }: { active: boolean; rank: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const key = `rankup-${rank}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, [active, rank]);

  if (!show) return null;

  return (
    <div className="rounded-2xl border border-lime/50 bg-lime/10 p-4 text-center animate-pulse">
      <p className="font-black uppercase tracking-wide text-lime text-lg">⬆️ Rank up — you hit {rank}!</p>
      <p className="text-muted text-xs mt-0.5">Consistency paid off. Keep the chain alive.</p>
    </div>
  );
}
