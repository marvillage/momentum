"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";

const field = "w-full bg-surface2 border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:border-lime outline-none";
const lbl = "text-[11px] font-black uppercase tracking-widest text-muted";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="font-black text-3xl tracking-tight">
            MO<span className="text-lime">/</span>MENTUM
          </div>
          <p className="text-muted text-sm mt-2">{mode === "login" ? "Welcome back. Let's move." : "Build your daily operator."}</p>
        </div>

        <form key={mode} action={formAction} className="rounded-2xl border border-line bg-surface p-6 space-y-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5">
              <span className={lbl}>Name (optional)</span>
              <input name="name" className={field} placeholder="Kush" autoComplete="name" />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Username</span>
            <input name="username" className={field} placeholder="kush" autoComplete="username" autoCapitalize="none" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Password</span>
            <input name="password" type="password" className={field} placeholder="••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>

          {state?.error && <p className="text-hot text-sm font-bold">{state.error}</p>}

          <button type="submit" disabled={pending} className="w-full bg-lime text-ground font-black uppercase text-sm px-4 py-3 rounded-lg disabled:opacity-50">
            {pending ? "…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-lime font-bold">
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
