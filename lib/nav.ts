import { prisma } from "./db";

export type NavGroup = { id: string; slug: string; name: string; icon: string | null; kind: string };

/** Groups shown in the navbar — only those with at least one active activity. */
export async function getNavGroups(userId: string): Promise<NavGroup[]> {
  const groups = await prisma.group.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    include: { activities: { where: { active: true }, select: { id: true } } },
  });
  return groups
    // Module groups (Gym, Food) always show; normal groups only when populated.
    .filter((g) => g.kind !== "NORMAL" || g.activities.length > 0)
    .map((g) => ({ id: g.id, slug: g.slug, name: g.name, icon: g.icon, kind: g.kind }));
}
