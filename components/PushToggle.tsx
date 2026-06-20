"use client";

import { useEffect, useState } from "react";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [subbed, setSubbed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !PUB) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker.getRegistration().then((reg) => reg?.pushManager.getSubscription().then((s) => setSubbed(!!s)));
  }, []);

  const enable = async () => {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setMsg("Permission denied."); setBusy(false); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(PUB!) });
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
      if (r.ok) { setSubbed(true); setMsg("Notifications on."); } else setMsg("Failed to save subscription.");
    } catch (e) {
      setMsg("Could not enable (on iPhone, add to Home Screen first, then open the app).");
    }
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setSubbed(false); setMsg("Notifications off."); setBusy(false);
  };

  const test = async () => {
    setBusy(true);
    const r = await fetch("/api/push/test", { method: "POST" });
    const j = await r.json();
    setMsg(j.sent > 0 ? "Sent — check your notifications." : j.skipped ? "Server keys not set." : "No active devices.");
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
      <h2 className="text-sm font-black uppercase tracking-widest text-lime">🔔 Notifications</h2>
      {!supported ? (
        <p className="text-muted text-sm">Push isn&apos;t available here. On iPhone, add the app to your Home Screen (Share → Add to Home Screen) and open it, then enable push from inside.</p>
      ) : (
        <>
          <p className="text-muted text-sm">Get a buzz on this device for reminders even when the app is closed.</p>
          <div className="flex items-center gap-2 flex-wrap">
            {!subbed ? (
              <button onClick={enable} disabled={busy} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">Enable on this device</button>
            ) : (
              <>
                <button onClick={test} disabled={busy} className="bg-lime text-ground font-black uppercase text-xs px-4 py-2.5 rounded-lg disabled:opacity-40">Send test</button>
                <button onClick={disable} disabled={busy} className="bg-surface2 border border-line text-muted font-black uppercase text-xs px-4 py-2.5 rounded-lg">Turn off</button>
              </>
            )}
            {msg && <span className="text-xs text-muted font-bold">{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
