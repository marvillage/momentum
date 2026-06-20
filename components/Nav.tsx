import Link from "next/link";
import { getNavGroups } from "@/lib/nav";
import { getCurrentUser } from "@/lib/auth";
import { NavMenu } from "@/components/NavMenu";

export async function Nav() {
  const user = await getCurrentUser();
  const groups = user && user.onboarded ? await getNavGroups(user.id) : [];

  const links = user && user.onboarded
    ? [
        { label: "Today", href: "/" },
        ...groups.map((g) => ({
          label: g.name,
          href: g.kind === "GYM" ? "/gym" : g.kind === "FOOD" ? "/food" : `/g/${g.slug}`,
          icon: g.icon,
        })),
        { label: "Stats", href: "/stats" },
        { label: "Manage", href: "/activities" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-black text-xl tracking-tight shrink-0">
          MO<span className="text-lime">/</span>MENTUM
        </Link>
        {links.length > 0 && <NavMenu links={links} />}
      </div>
    </header>
  );
}
