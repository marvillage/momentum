"use client";

import { useEffect, useState } from "react";

// Lightweight celebration when every scheduled task for today is done.
export function CleanSweep({ active }: { active: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    // Only celebrate once per day per device.
    const key = `sweep-${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;

  return (
    <div className={`rounded-2xl border border-lime/40 bg-lime/10 p-4 text-center ${show ? "animate-pulse" : ""}`}>
      <p className="font-black uppercase tracking-wide text-lime">🔥 Clean sweep — everything done today</p>
      <p className="text-muted text-xs mt-0.5">That&apos;s how rank climbs. See you tomorrow.</p>
    </div>
  );
}
