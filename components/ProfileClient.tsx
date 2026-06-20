"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/actions/auth";

const field = "bg-surface2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-lime outline-none";
const lbl = "text-[11px] font-black uppercase tracking-widest text-muted";
const card = "rounded-2xl border border-line bg-surface p-5 space-y-3";
const saveBtn = "bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40";

export function ProfileClient({
  username, name, morningPush, eveningPush,
}: {
  username: string;
  name: string;
  morningPush: string;
  eveningPush: string;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [nm, setNm] = useState(name);
  const [am, setAm] = useState(morningPush);
  const [pm, setPm] = useState(eveningPush);
  const [msg, setMsg] = useState("");
  const [cur, setCur] = useState("");
  const [nxt, setNxt] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const saveProfile = () => start(async () => {
    await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: nm, morningPush: am, eveningPush: pm }) });
    setMsg("Saved."); router.refresh(); setTimeout(() => setMsg(""), 2000);
  });

  const changePw = () => start(async () => {
    const r = await fetch("/api/profile/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current: cur, next: nxt }) });
    const j = await r.json();
    if (r.ok) { setPwMsg("Password changed."); setCur(""); setNxt(""); }
    else setPwMsg(j.error || "Failed");
    setTimeout(() => setPwMsg(""), 3000);
  });

  const del = () => {
    if (!confirm("Delete your account and ALL your data? This cannot be undone.")) return;
    if (!confirm("Really delete everything?")) return;
    start(async () => { await deleteAccount(); });
  };

  return (
    <div className="space-y-6">
      {/* account */}
      <div className={card}>
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">Account</h2>
        <div className="text-muted text-xs uppercase font-bold">Username: <span className="text-ink">{username}</span></div>
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Display name</span>
          <input className={field} value={nm} onChange={(e) => setNm(e.target.value)} placeholder="Your name" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Morning reminder</span>
            <input type="time" className={field} value={am} onChange={(e) => setAm(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Evening reminder</span>
            <input type="time" className={field} value={pm} onChange={(e) => setPm(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveProfile} className={saveBtn}>Save</button>
          {msg && <span className="text-xs text-lime font-bold">{msg}</span>}
        </div>
        <p className="text-muted text-[11px]">Macro targets are edited on the Food page.</p>
      </div>

      {/* password */}
      <div className={card}>
        <h2 className="text-sm font-black uppercase tracking-widest text-lime">Change password</h2>
        <input type="password" className={`${field} w-full`} value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" autoComplete="current-password" />
        <input type="password" className={`${field} w-full`} value={nxt} onChange={(e) => setNxt(e.target.value)} placeholder="New password (6+ chars)" autoComplete="new-password" />
        <div className="flex items-center gap-3">
          <button onClick={changePw} disabled={!cur || !nxt} className={saveBtn}>Update password</button>
          {pwMsg && <span className="text-xs text-muted font-bold">{pwMsg}</span>}
        </div>
      </div>

      {/* danger */}
      <div className="rounded-2xl border border-hot/40 bg-hot/5 p-5 space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-hot">Danger zone</h2>
        <p className="text-muted text-sm">Permanently delete your account and every activity, log, and stat tied to it.</p>
        <button onClick={del} className="bg-hot/15 text-hot border border-hot/40 font-black uppercase text-xs px-4 py-2.5 rounded-lg">Delete account</button>
      </div>
    </div>
  );
}
