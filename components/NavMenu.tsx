"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

type L = { label: string; href: string; icon?: string | null };

export function NavMenu({ links }: { links: L[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* desktop: inline */}
      <nav className="hidden md:flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-muted">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink transition-colors whitespace-nowrap">
            {l.icon ? <span className="mr-1">{l.icon}</span> : null}
            {l.label}
          </Link>
        ))}
        <form action={logout}>
          <button type="submit" className="text-muted/70 hover:text-hot transition-colors" title="Log out">⏻</button>
        </form>
      </nav>

      {/* mobile: ⋯ dropdown */}
      <div className="md:hidden relative">
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="text-2xl leading-none px-2 py-1 text-muted hover:text-ink">
          ⋯
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-line bg-surface shadow-2xl py-1.5 overflow-hidden">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted hover:text-ink hover:bg-surface2 transition-colors"
                >
                  {l.icon ? <span className="text-base">{l.icon}</span> : null}
                  {l.label}
                </Link>
              ))}
              <form action={logout} className="border-t border-line mt-1 pt-1">
                <button type="submit" className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide text-hot/80 hover:bg-surface2 transition-colors">
                  ⏻ Log out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
