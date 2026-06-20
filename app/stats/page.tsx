import { getStats } from "@/lib/stats";
import { getGameState } from "@/lib/game";
import { Heatmap } from "@/components/Heatmap";
import { RankBadge } from "@/components/RankBadge";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await requireUser();
  const [{ totals, perActivity, heatmap }, game] = await Promise.all([getStats(user.id), getGameState(user.id)]);
  const activeStreaks = perActivity.filter((a) => a.active);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">The truth</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">Stats</h1>
      </div>

      <RankBadge game={game} />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="text-5xl font-black text-lime">{totals.done}</div>
          <div className="text-muted text-xs font-bold uppercase tracking-widest mt-1">tasks completed</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="text-5xl font-black">{totals.activities}</div>
          <div className="text-muted text-xs font-bold uppercase tracking-widest mt-1">areas tracked</div>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">Consistency · last 12 weeks</h2>
        <div className="rounded-2xl border border-line bg-surface p-5 overflow-x-auto">
          <Heatmap data={heatmap} />
          <p className="text-muted text-[11px] mt-3 uppercase tracking-wide font-semibold">
            Each square = a day. Brighter = more of that day&apos;s plan finished.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">Streaks</h2>
        <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
          {activeStreaks.length === 0 && (
            <div className="p-6 text-muted text-sm">Complete some tasks and your streaks show up here.</div>
          )}
          {activeStreaks.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{a.name}</div>
                <div className="text-muted text-[11px] uppercase tracking-wide font-semibold mt-0.5">
                  {a.area} · {a.doneCount} done · {a.rate30}% last 30d · best {a.longest}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-2xl font-black text-lime">{a.streak}</span>
                <span className="text-muted text-[11px] font-bold uppercase ml-1">{a.streak === 1 ? "day" : "days"} 🔥</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
