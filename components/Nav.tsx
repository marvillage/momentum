import Link from "next/link";
import { getNavGroups } from "@/lib/nav";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const linkCls = "hover:text-ink transition-colors whitespace-nowrap";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-black text-xl tracking-tight shrink-0">
          MO<span className="text-lime">/</span>MENTUM
        </Link>
        {user && user.onboarded && <NavLinks userName={user.name || user.username} />}
      </div>
    </header>
  );
}

async function NavLinks({ userName }: { userName: string }) {
  const u = await getCurrentUser();
  const groups = u ? await getNavGroups(u.id) : [];

  return (
    <nav className="flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-muted overflow-x-auto">
      <Link href="/" className={linkCls}>Today</Link>
      {groups.map((g) => (
        <Link key={g.id} href={g.kind === "GYM" ? "/gym" : g.kind === "FOOD" ? "/food" : `/g/${g.slug}`} className={linkCls}>
          {g.icon ? <span className="mr-1">{g.icon}</span> : null}
          {g.name}
        </Link>
      ))}
      <Link href="/stats" className={linkCls}>Stats</Link>
      <Link href="/activities" className={linkCls}>Manage</Link>
      <form action={logout} className="contents">
        <button type="submit" className="text-muted/70 hover:text-hot transition-colors" title={`Log out ${userName}`}>
          ⏻
        </button>
      </form>
    </nav>
  );
}
