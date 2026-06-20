import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TRACK_SUMMARY } from "@/lib/tracks";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser({ allowUnonboarded: true });
  if (user.onboarded) redirect("/");

  const [groups, acts] = await Promise.all([
    prisma.group.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <OnboardingWizard
      name={user.name ?? ""}
      groups={groups.map((g) => ({ id: g.id, name: g.name, icon: g.icon }))}
      tracks={TRACK_SUMMARY}
      initial={acts.map((a) => ({ id: a.id, name: a.name, icon: a.icon, type: a.type }))}
    />
  );
}
