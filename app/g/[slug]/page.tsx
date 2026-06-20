import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureToday, getDashboard } from "@/lib/planner";
import { requireUser } from "@/lib/auth";
import { TaskBoard } from "@/components/TaskBoard";
import { todayStr, niceDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const group = await prisma.group.findFirst({ where: { slug, userId: user.id } });
  if (!group) notFound();
  if (group.kind === "GYM") redirect("/gym");
  if (group.kind === "FOOD") redirect("/food");
  if (group.kind === "JIRA") redirect("/aecad");

  await ensureToday(user.id);
  const { todays, backlog } = await getDashboard(user.id, { groupId: group.id });
  const doneCount = todays.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">
          {group.icon ? `${group.icon} ` : ""}Group
        </p>
        <h1 className="text-5xl font-black uppercase tracking-tight">{group.name}</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">
          {niceDate(todayStr())} · {doneCount} of {todays.length} done
        </p>
      </section>

      <TaskBoard todays={todays} backlog={backlog} emptyHint={`No ${group.name} tasks scheduled today.`} />
    </div>
  );
}
