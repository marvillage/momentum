import { getStats } from "@/lib/stats";
import { getGameState } from "@/lib/game";
import { Heatmap } from "@/components/Heatmap";
import { RankBadge } from "@/components/RankBadge";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await requireUser();
  const [{ totals, perActivity, heatmap, byWeekday }, game] = await Promise.all([getStats(user.id), getGameState(user.id)]);
  const ranked = [...byWeekday].filter((d) => d.total > 0).sort((a, b) => b.rate - a.rate);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const activeStreaks = perActivity.filter((a) => a.active);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">The truth</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">Stats</h1>
      </div>

      <RankBadge game={game} />

      {/* weekly recap */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">This week</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4 text-center">
            <div className="text-3xl font-black text-lime">{game.weekly.cleanSweeps}</div>
            <div className="text-muted text-[10px] font-bold uppercase tracking-widest mt-1">clean sweeps</div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 text-center">
            <div className="text-3xl font-black">{game.weekly.done}</div>
            <div className="text-muted text-[10px] font-bold uppercase tracking-widest mt-1">tasks done</div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 text-center">
            <div className="text-3xl font-black">{game.weekly.activeDays}<span className="text-muted text-lg">/7</span></div>
            <div className="text-muted text-[10px] font-bold uppercase tracking-widest mt-1">active days</div>
          </div>
        </div>
      </section>

      {/* weekday insight */}
      {best && (
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">By weekday</h2>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-end justify-between gap-2 h-24">
              {byWeekday.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t bg-lime/70" style={{ height: `${d.rate}%` }} title={`${d.rate}% completed`} />
                  </div>
                  <span className="text-[10px] font-bold text-muted">{d.label[0]}</span>
                </div>
              ))}
            </div>
            <p className="text-muted text-[11px] mt-3 uppercase tracking-wide font-semibold">
              Strongest: <span className="text-lime">{best.label} ({best.rate}%)</span>
              {worst && worst.label !== best.label ? <> · Weakest: <span className="text-hot">{worst.label} ({worst.rate}%)</span></> : null}
            </p>
          </div>
        </section>
      )}

      {/* badges */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-lime mb-3">Badges</h2>
        <div className="grid grid-cols-4 gap-3">
          {game.badges.map((b) => (
            <div
              key={b.key}
              className={`rounded-2xl border p-3 text-center ${b.earned ? "border-lime/40 bg-lime/5" : "border-line bg-surface opacity-40"}`}
              title={b.label}
            >
              <div className={`text-2xl ${b.earned ? "" : "grayscale"}`}>{b.emoji}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide mt-1 leading-tight">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

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
