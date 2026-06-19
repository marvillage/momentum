import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-tight">
          MO<span className="text-lime">/</span>MENTUM
        </Link>
        <nav className="flex items-center gap-5 text-sm font-bold uppercase tracking-wide text-muted">
          <Link href="/" className="hover:text-ink transition-colors">
            Today
          </Link>
          <Link href="/gym" className="hover:text-ink transition-colors">
            Gym
          </Link>
          <Link href="/stats" className="hover:text-ink transition-colors">
            Stats
          </Link>
          <Link href="/activities" className="hover:text-ink transition-colors">
            Manage
          </Link>
        </nav>
      </div>
    </header>
  );
}
