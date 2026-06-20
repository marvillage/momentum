import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ProfileClient } from "@/components/ProfileClient";
import { PushToggle } from "@/components/PushToggle";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">You</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">Profile</h1>
      </div>
      <ProfileClient
        username={user.username}
        name={user.name ?? ""}
        morningPush={settings?.morningPush ?? "07:30"}
        eveningPush={settings?.eveningPush ?? "21:00"}
      />
      <PushToggle />
    </div>
  );
}
