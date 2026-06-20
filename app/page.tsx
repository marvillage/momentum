import { ensureToday, getDashboard } from "@/lib/planner";
import { TaskBoard } from "@/components/TaskBoard";
import { RankBadge } from "@/components/RankBadge";
import { CleanSweep } from "@/components/CleanSweep";
import { RankUp } from "@/components/RankUp";
import { getGameState } from "@/lib/game";
import { requireUser } from "@/lib/auth";
import { todayStr, niceDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  await ensureToday(user.id);
  const [{ todays, backlog }, game] = await Promise.all([getDashboard(user.id), getGameState(user.id)]);
  const doneCount = todays.filter((t) => t.status === "DONE").length;
  const cleanSweep = todays.length > 0 && doneCount === todays.length;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">Your day</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">Today</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">
          {niceDate(todayStr())} · {doneCount} of {todays.length} done
        </p>
      </section>

      <RankBadge game={game} />
      <RankUp active={game.rankedUp} rank={game.rankLabel} />
      <CleanSweep active={cleanSweep} />

      <TaskBoard todays={todays} backlog={backlog} />
    </div>
  );
}
